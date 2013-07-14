import os

from flask import Flask
from flask import render_template

import flask.ext.sqlalchemy
import flask.ext.restless

app = Flask(__name__)
app.config['DEBUG'] = True
#app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/test.db'
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
db = flask.ext.sqlalchemy.SQLAlchemy(app)


class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    nickname = db.Column(db.String(120))
    address = db.Column(db.String(120))

def init_db():
    with app.app_context():
        db = flask.ext.sqlalchemy.SQLAlchemy(app)
        db.create_all()


@app.route('/', methods=['GET'])
def index():
    return render_template("index.html")

manager = flask.ext.restless.APIManager(app, flask_sqlalchemy_db=db)
manager.create_api(Favorite, methods=['GET', 'POST', 'PUT', 'DELETE'])


if __name__ == '__main__':
    init_db()
    db.create_all()
    app.run(debug=True)
