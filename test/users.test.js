const supertest = require('supertest')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('../models/users')
const helper = require('./test_helpers')
const app = require('../app')
const api = supertest(app)

describe('when there is initially no user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('supersecret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const userAtStart = await helper.usersInDb()

    const newUser = {
      username: 'shiddo',
      name: 'Yohann Tisserand',
      password: 'mypassword123'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(userAtStart.length + 1)

    const usernames = usersAtEnd.map(user => user.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username is already taken', async () => {
    const userAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'superuser',
      password: 'mypassword123'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('username is already taken')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(userAtStart)
  })
})

afterAll(() => {
  mongoose.connection.close()
})