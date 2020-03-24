import express from 'express';
import auth from 'http-auth';
import { username, password } from '../config';

const router = express.Router();
const basic = auth.basic({
        realm: 'Basic Auth'
    }, (user, pass, callback) => { 
        callback(user === username && pass === password);
    }
);

router.get('/', (req, res) => {
	res.render('home');
});

// Admin
router.get('/admin', basic.check(async (req, res) => {
	res.render('admin');
}));

router.post('/login',
	(req, res, next) => {
		return next();
	},
	(req, res) => {
		res.redirect('/admin');
	}
);

module.exports = router;
