import passport from 'passport';

class Strategy extends passport.Strategy {
	constructor(verify, issue, options = null) {
		let strategyName = options.name || 'remember-me';

		super(strategyName);

		if (!verify) throw new Error('remember me cookie authentication st;rategy requires a verify function');
		if (!issue) throw new Error('remember me cookie authentication strategy requires an issue function');

		this.key = options.key || 'remember_me'; // cookie key
		this.name = strategyName // strategy name
		this.opts = {
			path: '/',
			httpOnly: true,
			maxAge: 604800000,
			...options.cookie
		};
		this.verify = verify;
		this.issue = issue;
	}

	authenticate(req, options) {
		// if (req.isAuthenticated()) { return this.pass(); }

		// let token = req.cookies[this._key];
	
		// if (!token) { return this.pass(); }

		// this.verify(req, token, verified);

		console.log(req);

		return this.pass();
	}
}

export default Strategy;

function verified(err, user, info) {
	if (err) { return this.error(err); }

	let res = req.res;

	if (!user) {
		res.clearCookie(self._key);
		return self.pass();
	}

	function issued(err, val) {
		if (err) { return self.error(err); }
		res.cookie(self._key, val, self._opts);
		return this.success(user, info);
	}

	this.issue(req, user, issued);
}