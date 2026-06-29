import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { verifyCredentials } from '../services/authService.js';
import { findUserById } from '../models/userModel.js';

// Admin/technician login. Config only orchestrates; the real work is in the service.
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await verifyCredentials(email, password);
        if (!user) return done(null, false, { message: 'Invalid email or password' });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

export default passport;
