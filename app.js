import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import mongoose from 'mongoose';
import flash from 'connect-flash';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { MongoURI as db } from './config.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Host Static files
app.use('/public', express.static('public'));

// Connect to Mongo
mongoose.connect(db, { useNewUrlParser: true })
	.then((result) => {
		console.log('MognDB connected');
	}).catch((err) => {
		console.warn(err);
	});

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(flash());

// Global Vars
app.use((req, res, next) => {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	next();
});

// Routes
app.use('/', require('./routes/index'));

app.listen(PORT, console.log(`Server started on http://localhost:${ PORT }`));