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

const getAuthTokenId = (req, res) => {
    const { authorization } = req.headers;
    return redisClient.get(authorization, (err, reply) => {
        if (err || !reply) {
            return res.status(400).json('Unauthorized');
        }
        return res.json( {id: reply} );
    })
};

const signToken = (email) => jwt.sign({ email }, 'JWT_SECRET', { expiresIn: '2 days' });

const setToken = (token, id) => Promise.resolve(redisClient.set(token, id));

const createSessions = (user) => {
    const {email,  id} = user,
        token = signToken(email);

    return setToken(token, id)
        .then(() => { return {success: 'true', userId: id, token} })
        .catch(console.log)
};

const signInAuthentication = (db, bcrypt) => (req, res) => {
    return req.headers.authorization ? getAuthTokenId(req, res) : handleSignIn(db, bcrypt, req, res)
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