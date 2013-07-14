import json
import unittest

from flask import Flask

import api
from api import Favorite
from api import db

class APITestCase(unittest.TestCase):
    def setUp(self):
        super(APITestCase, self).setUp()
        api.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite://'
        api.app.config['TESTING'] = True
        self.app = api.app.test_client()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

    def test_new_favorite(self):
        response = self.app.get('/api/favorite')
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 200)
        response_json = json.loads(response.data)
        self.assertEqual(response_json['num_results'], 0)

        response = self.app.post('/api/favorite',
                content_type='application/json',
                data=json.dumps({'lat': 37.22,
                    'lng': -122.22,
                    'nickname': 'test_favorite'}))
        self.assertEqual(response.status_code, 201)
        response_json = json.loads(response.data)
        self.assertIsNotNone(response_json)

        response = self.app.get('/api/favorite/1')
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 200)
        response_json = json.loads(response.data)
        self.assertEqual(response_json['id'], 1)


    def test_empty_db(self):
        response = self.app.get('/api/favorite')
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 200)
        response_json = json.loads(response.data)
        self.assertEqual(response_json['num_results'], 0)
