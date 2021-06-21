const del = require('del');
const gulp = require('gulp');
const sass = require('gulp-sass');
const server = require('browser-sync');
const htmlmin = require('gulp-htmlmin');
const concatJs = require('gulp-concat');
const minifyJS = require('gulp-uglify');
const cache = require('gulp-cache-bust');
const optimizeImg = require('gulp-image');
const minifyCss = require('gulp-clean-css');
const concatCss = require('gulp-concat-css');
const htmlReplace = require('gulp-html-replace');
const fileInclude = require('gulp-file-include');

sass.compiler = require('node-sass');

const path = {
	temp: './temp',
	build: './build',
};

gulp.task('clean', async cb => {
	return del(['temp', 'build'], cb);
});

gulp.task('copy-image', async () => {
	return gulp
		.src('./src/assets/img/**/*')
		.pipe(gulp.dest(`${path.temp}/assets/img`))
		.pipe(server.stream());
});

gulp.task('optimize-image', async () => {
	return gulp
		.src('./src/assets/img/**/*')
		.pipe(optimizeImg())
		.pipe(gulp.dest(`${path.build}/assets/img`));
});

gulp.task('compile-sass:dev', async () => {
	return gulp
		.src('./src/assets/scss/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(concatCss('bundle.css'))
		.pipe(gulp.dest(`${path.temp}/assets/css`))
		.pipe(server.stream());
});

gulp.task('compile-sass:prod', async () => {
	return gulp
		.src('./src/assets/scss/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(concatCss('bundle.min.css'))
		.pipe(minifyCss())
		.pipe(gulp.dest(`${path.build}/assets/css`));
});

gulp.task('concat-js', async () => {
	return gulp
		.src('./src/assets/js/**/*.js')
		.pipe(concatJs('bundle.js'))
		.pipe(gulp.dest(`${path.temp}/assets/js`))
		.pipe(server.stream());
});

gulp.task('minify-js', async () => {
	return gulp
		.src('./src/assets/js/**/*.js')
		.pipe(concatJs('bundle.min.js'))
		.pipe(minifyJS())
		.pipe(gulp.dest(`${path.build}/assets/js`));
});

gulp.task('build-html:dev', async () => {
	return gulp
		.src('./src/index.html')
		.pipe(fileInclude({ prefix: '@@', basepath: '@file' }))
		.pipe(
			htmlReplace({
				css: 'assets/css/bundle.css',
				js: 'assets/js/bundle.js',
			})
		)
		.pipe(gulp.dest(path.temp))
		.pipe(server.stream());
});

gulp.task('build-html:prod', async () => {
	return gulp
		.src('./src/index.html')
		.pipe(fileInclude({ prefix: '@@', basepath: '@file' }))
		.pipe(htmlmin({ collapseWhitespace: true, minifyURLs: true }))
		.pipe(
			htmlReplace({
				css: 'assets/css/bundle.min.css',
				js: 'assets/js/bundle.min.js',
			})
		)
		.pipe(cache({ type: 'timestamp' }))
		.pipe(gulp.dest(path.build));
});

gulp.task('server', async () => {
	server.init({
		server: {
			baseDir: path.temp,
		},
	});

	gulp.watch('./src/assets/scss/**/*.scss', gulp.series('compile-sass:dev'));
	gulp.watch('./src/assets/js/**/*.js', gulp.series('concat-js'));
	gulp.watch('./src/assets/img/**/*', gulp.series('copy-image'));
	gulp.watch(['./src/**/*.html'], gulp.series('build-html:dev'));
});

exports.dev = gulp.series(['clean', 'copy-image', 'concat-js', 'compile-sass:dev', 'build-html:dev', 'server']);
exports.build = gulp.series(['clean', 'optimize-image', 'minify-js', 'compile-sass:prod', 'build-html:prod']);
