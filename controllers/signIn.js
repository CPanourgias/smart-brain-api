const jwt = require('jsonwebtoken');
const redis = require('redis');

const redisClient = redis.createClient(process.env.REDIS_URI);

const handleSignIn = (db, bcrypt, req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return Promise.reject('email or password not provided');}
  return db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db.select('*').from('users')
          .where('email', '=', email)
          .then(user => user[0])
          .catch(err => Promise.reject('unable to get user'))
      } else {
          return Promise.reject('wrong credentials');
      }
    })
    .catch(err => Promise.reject('wrong credentials'))
};

const getAuthTokenId = () => console.log('auth ok');

const signToken = (email) => jwt.sign({ email }, 'JWT_SECRET', { expiresIn: '2 days' });

const createSessions = (user) => {
    const {email,  id} = user,
        token = signToken(email);

    return { success: true, userId: id, token }
};

const signInAuthentication = (db, bcrypt) => (req, res) => {
    const { authorization } = req.headers;
    return authorization ? getAuthTokenId() : handleSignIn(db, bcrypt, req, res)
        .then(data => {
            return data.id && data.email ? createSessions(data) : Promise.reject(data)
        })
        .then(session => res.json(session))
        .catch(err => res.status(400).json(err));
};

module.exports = {
    handleSignIn: handleSignIn,
    signInAuthentication: signInAuthentication
};