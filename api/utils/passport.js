import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import LocalStrategy from 'passport-local';
import { Representative } from '../accounts/models';
import { comparePassword } from '../auth/helpers';

// Create local Strategy
const localOptions = { usernameField: 'email' };
const localLogin = new LocalStrategy(localOptions, (email, password, done) => {
  Representative.where({ email })
    .fetch({ withRelated: ['organization', 'organization.address', 'organization.integrations', 'organization.messageEntries'] })
    .then((foundRep) => {
      if (!foundRep) {
        done(null, false);
      } else {
        comparePassword(foundRep.toJSON(), password).then((isMatch) => {
          if (!isMatch) {
            done(null, false);
          } else {
            done(null, foundRep.toJSON());
          }
        }).catch(err => done(err));
      }
    }).catch(err => done(err));
});

// Create JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromHeader('authorization'),
  secretOrKey: process.env.TOKEN_SECRET,
};
const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
  Representative.where({ id: payload.sub }).fetch({ withRelated: ['organization', 'organization.address', 'organization.integrations', 'organization.messageEntries'] })
    .then((foundRep) => {
      if (foundRep) {
        done(null, foundRep.toJSON());
      } else {
        done(null, false);
      }
    }).catch(err => done(err));
});

passport.use(localLogin);
passport.use(jwtLogin);

export const requireAuth = passport.authenticate('jwt', { session: false });
export const requireSignIn = passport.authenticate('local', { session: false });
