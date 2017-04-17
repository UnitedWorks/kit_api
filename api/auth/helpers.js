import jwt from 'jwt-simple';
import bcrypt from 'bcrypt-nodejs';

export const tokenForUser = (user) => {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, process.env.TOKEN_SECRET);
};

export const comparePassword = (rep, candidatePassword) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, rep.password, (err, isMatch) => {
      if (err) reject(err);
      resolve(isMatch);
    });
  });
};
