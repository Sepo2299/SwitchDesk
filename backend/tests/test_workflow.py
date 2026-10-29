"""Exercise security boundaries and ticket changes against an isolated database."""
import os
os.environ['DATABASE_URL'] = 'sqlite://'
os.environ['SECRET_KEY'] = 'test-only-secret-do-not-use-outside-this-test-suite'

import jwt
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models import User, TicketEvent
from app.security import hash_password, SECRET_KEY


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    with TestClient(app) as client:
        yield client


def register(client, email='person@example.com', name='Test Person'):
    response = client.post('/api/auth/register', json={'email': email, 'name': name, 'password': 'StrongPassword123!'})
    assert response.status_code == 201
    return response.json()


def login(client, email='person@example.com'):
    response = client.post('/api/auth/login', json={'email': email, 'password': 'StrongPassword123!'})
    assert response.status_code == 200
    return {'Authorization': 'Bearer ' + response.json()['access_token']}


def technician(client):
    register(client, 'staff@example.com', 'Support Staff')
    with SessionLocal() as db:
        user = db.query(User).filter_by(email='staff@example.com').one()
        user.role = 'technician'
        db.commit()
    return login(client, 'staff@example.com')


def create(client, headers):
    result = client.post('/api/tickets', headers=headers, json={'title': 'Network access blocked', 'description': 'The office network is unavailable on my workstation.', 'category': 'Network', 'priority': 'High'})
    assert result.status_code == 201
    return result.json()


def test_registration_hashes_password_and_cannot_elevate_role(client):
    response = client.post('/api/auth/register', json={'email': '  PERSON@example.com ', 'name': '  Test Person  ', 'password': 'StrongPassword123!', 'role': 'admin'})
    assert response.status_code == 201
    assert response.json()['role'] == 'employee'
    assert 'password_hash' not in response.json()
    assert response.json()['name'] == 'Test Person'
    with SessionLocal() as db:
        user = db.query(User).one()
        assert user.email == 'person@example.com'
        assert user.password_hash.startswith('$argon2')
        assert user.password_hash != 'StrongPassword123!'
    assert client.post('/api/auth/register', json={'email': 'person@example.com', 'name': 'Someone Else', 'password': 'StrongPassword123!'}).status_code == 409


def test_employee_isolation_covers_ticket_comments_history_and_analytics(client):
    register(client)
    owner = login(client)
    ticket = create(client, owner)
    register(client, 'other@example.com')
    other = login(client, 'other@example.com')
    for suffix in ['', '/comments', '/events']:
        assert client.get(f"/api/tickets/{ticket['id']}{suffix}", headers=other).status_code == 404
    assert client.post(f"/api/tickets/{ticket['id']}/comments", headers=other, json={'body': 'Trying to access'}).status_code == 404
    assert client.get('/api/tickets', headers=other).json() == []
    assert client.get('/api/analytics', headers=other).json()['total'] == 0
    assert client.get('/api/users', headers=owner).status_code == 403
    assert client.patch(f"/api/tickets/{ticket['id']}", headers=owner, json={'status': 'Resolved'}).status_code == 403


def test_staff_workflow_records_actual_history_and_resolution_counts(client):
    register(client)
    owner = login(client)
    t = create(client, owner)
    support = technician(client)
    me = client.get('/api/me', headers=support).json()
    url = f"/api/tickets/{t['id']}"
    updated = client.patch(url, headers=support, json={'assigned_to': me['id'], 'status': 'In Progress'})
    assert updated.status_code == 200
    assert updated.json()['assigned_to'] == me['id']
    assert client.post(url+'/comments', headers=support, json={'body': '  Investigating the gateway.  '}).status_code == 201
    assert client.get(url+'/comments', headers=owner).json()[0]['body'] == 'Investigating the gateway.'
    assert client.patch(url, headers=support, json={'status': 'Resolved'}).status_code == 200
    a = client.get('/api/analytics', headers=owner).json()
    assert a['resolution_rate'] == 100
    assert sum(d['created'] for d in a['activity']) == 1
    assert sum(d['resolved'] for d in a['activity']) == 1
    assert len(a['activity']) == 7
    # Resolved -> Closed must not count the same resolution twice.
    assert client.patch(url, headers=support, json={'status': 'Closed'}).status_code == 200
    assert sum(d['resolved'] for d in client.get('/api/analytics', headers=owner).json()['activity']) == 1
    history = client.get(url+'/events', headers=owner).json()
    assert len(history) == 6
    assert any('Assignment:' in e['description'] for e in history)
    assert all('actor_name' in e for e in history)


def test_invalid_values_and_blank_text_are_rejected(client):
    register(client)
    owner = login(client)
    t = create(client, owner)
    support = technician(client)
    url = f"/api/tickets/{t['id']}"
    for body in [{'status': None}, {'priority': None}, {'assigned_to': -1}, {'status': 'Done'}]:
        assert client.patch(url, headers=support, json=body).status_code == 422
    assert client.post(url+'/comments', headers=owner, json={'body': '    '}).status_code == 422
    assert client.post('/api/tickets', headers=owner, json={'title': '     ', 'description': '             ', 'category': 'Network', 'priority': 'Low'}).status_code == 422
    owner_id = client.get('/api/me', headers=owner).json()['id']
    assert client.patch(url, headers=support, json={'assigned_to': owner_id}).status_code == 422


def test_missing_forged_expired_and_incomplete_tokens_are_rejected(client):
    assert client.get('/api/tickets').status_code == 401
    register(client)
    for claims, key in [({'sub': '1', 'exp': datetime.now(timezone.utc)+timedelta(hours=1)}, 'wrong-secret-key-that-is-at-least-thirty-two-chars'), ({'sub': '1', 'exp': datetime.now(timezone.utc)-timedelta(seconds=1)}, SECRET_KEY), ({'sub': '1'}, SECRET_KEY)]:
        token = jwt.encode(claims, key, algorithm='HS256')
        assert client.get('/api/me', headers={'Authorization': 'Bearer '+token}).status_code == 401
    assert client.post('/api/auth/login', json={'email': 'person@example.com', 'password': 'wrong'}).status_code == 401


def test_hosted_admin_is_created_once_without_resetting_password(client, monkeypatch):
    from app.bootstrap import create_initial_admin
    from app.security import verify_password
    monkeypatch.setenv('BOOTSTRAP_ADMIN_EMAIL', ' Admin@switchdesk.local ')
    monkeypatch.setenv('BOOTSTRAP_ADMIN_PASSWORD', 'FirstPrivatePassword123!')
    with SessionLocal() as db:
        create_initial_admin(db)
        admin = db.query(User).filter_by(email='admin@switchdesk.local').one()
        assert admin.role == 'admin'
        assert verify_password('FirstPrivatePassword123!', admin.password_hash)
        original_hash = admin.password_hash
        monkeypatch.setenv('BOOTSTRAP_ADMIN_PASSWORD', 'DifferentPrivatePassword456!')
        create_initial_admin(db)
        db.refresh(admin)
        assert admin.password_hash == original_hash
        assert db.query(User).count() == 1


def test_bootstrap_rejects_incomplete_weak_or_existing_employee_credentials(client, monkeypatch):
    from app.bootstrap import create_initial_admin
    monkeypatch.delenv('BOOTSTRAP_ADMIN_EMAIL', raising=False)
    monkeypatch.delenv('BOOTSTRAP_ADMIN_PASSWORD', raising=False)
    with SessionLocal() as db:
        create_initial_admin(db)
        assert db.query(User).count() == 0
        monkeypatch.setenv('BOOTSTRAP_ADMIN_EMAIL', 'person@example.com')
        with pytest.raises(RuntimeError, match='Set both'):
            create_initial_admin(db)
        monkeypatch.setenv('BOOTSTRAP_ADMIN_PASSWORD', 'short')
        with pytest.raises(RuntimeError, match='12 characters'):
            create_initial_admin(db)
        register(client)
        monkeypatch.setenv('BOOTSTRAP_ADMIN_PASSWORD', 'PrivatePassword123!')
        with pytest.raises(RuntimeError, match='non-administrator'):
            create_initial_admin(db)
        assert db.query(User).one().role == 'employee'


@pytest.mark.parametrize('source,expected', [
    ('postgres://user:password@db:5432/app', 'postgresql+psycopg://user:password@db:5432/app'),
    ('postgresql://user:password@db:5432/app', 'postgresql+psycopg://user:password@db:5432/app'),
    ('postgresql+psycopg://user:password@db/app', 'postgresql+psycopg://user:password@db/app'),
    ('sqlite://', 'sqlite://'),
])
def test_host_database_urls_use_the_installed_driver(source, expected):
    from app.database import normalize_database_url
    assert normalize_database_url(source) == expected
