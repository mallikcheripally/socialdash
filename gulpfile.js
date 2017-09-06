/*eslint-env node */

var gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins');
var browserSync = require('browser-sync');
var path = require('path');
var del = require('del');
var runSequence = require('run-sequence');
var swPrecache = require('sw-precache');
var pagespeed = require('psi').output;
var pkg = require('./package.json');

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

//Lint JavaScript
gulp.task('lint', function () {
    gulp.src(['app/js/**/*.js'])
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
});

//Optimize Images
gulp.task('images', function () {
    gulp.src(['app/images/**/*.{png,gif,jpg,webp}'])
        .pipe($.cache($.imagemin([
            $.imagemin.gifsicle({interlaced: true}),
            $.imagemin.jpegtran({progressive: true}),
            $.imagemin.optipng({optimizationLevel: 5}),
            $.imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ])))
        .pipe(gulp.dest('dist/images'));
});

//Convert to webp and optimize
gulp.task('webp', function () {
    gulp.src(['app/images/posts/*'])
        .pipe($.webp({quality: 50}))
        .pipe(gulp.dest('app/images/posts'));
});

//Compile and automatically prefix stylesheets
gulp.task('styles', function () {
    const AUTOPREFIX_BROWSERS = [
        'ie >= 10',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
    ];
    return gulp.src([
        'app/styles/home.scss',
        'app/styles/login.scss',
        'app/styles/signup.scss',
        'app/styles/dashboard.scss',
        'app/styles/facebook.scss',
        'app/styles/twitter.scss',
        'app/styles/instagram.scss',
        'app/styles/contact.scss'
    ])
        .pipe($.sass({
            precision: 10
        }).on('error', $.sass.logError))
        .pipe($.autoprefixer(AUTOPREFIX_BROWSERS))
        .pipe($.if('*.css', $.cssnano()))
        .pipe(gulp.dest('dist/styles'));
});

//Concatenate and minify JavaScript
gulp.task('scripts', function () {
    return gulp.src('app/scripts/**/*.js')
        .pipe($.uglify())
        .pipe(gulp.dest('dist/scripts'));
});

//Scan HTML for assets, optimize them and minify HTML
gulp.task('html', function () {
    return gulp.src('app/**/*.html')
        .pipe($.useref({
            searchPath: '{app}',
            noAssets: true
        }))
        .pipe($.if('*.html', $.htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            removeOptionalTags: true
        })))
        .pipe($.if('*.html', $.size({title: 'html', showFiles: true})))
        .pipe(gulp.dest('dist'));
});

//Clean 'dist' directory
gulp.task('clean', function () {
    del.sync(['dist/**'], {dot: true});
});

//Initiate server
gulp.task('serve', function () {
    browserSync.init({
        notify: false,
        logPrefix: 'WSK',
        server: 'dist',
        port: 3000
    });
});

//Dev Server and watching changes
gulp.task('dev', ['clean'], function () {
    runSequence('images', 'styles', 'html', 'serve');
    // runSequence('images', 'scripts', 'styles', 'html', 'serve');
    gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload]);
    // gulp.watch(['app/scripts/**/*.js'], ['lint', 'scripts', reload]);
    gulp.watch(['app/images/**/*'], ['images', reload]);
    gulp.watch(['app/**/*.html'], ['html', reload]);
});

//Build and serve from the 'dist' directory
gulp.task('serve:dist', ['default'], function () {
    browserSync({
        notify: false,
        logPrefix: 'WSK',
        server: 'dist',
        port: 3001
    })
});

//Build production files
gulp.task('default', ['clean'], function () {
    runSequence(
        'styles',
        ['lint', 'html', 'scripts', 'images']
    )
});