import passport from 'passport';
import { Profile, Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../../../entities/user';
import { getEnvConfig } from '../../../config/env';
import Exception from '../../../errors/Exception';
import { HttpStatusCode } from 'axios';

const { googleClientId, googleClientSecret, googleCallbackUrl } = getEnvConfig();

export interface IGoogleUser {
  email: string;
  googleId: string;
  isNewUser: boolean;
}

passport.use(
  new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: `${googleCallbackUrl}/api/v1/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) throw new Exception(HttpStatusCode.Unauthorized, 'Email not found in Google profile');

        const user = await User.findOne({
          $or: [{ email }, { googleId: profile.id }],
        });

        if (user) {
          if (!user.googleId) {
            // account linking
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        }

        // new user
        done(null, {
          email,
          googleId: profile.id,
          isNewUser: true,
        });
      } catch (err) {
        if (err instanceof Exception) throw err;
        return done(err, undefined);
      }
    },
  ),
);
