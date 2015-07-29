var gulp = require('gulp');
var del = require('del');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var less = require('gulp-less');
var uglify = require('gulp-uglify');
var zip = require('gulp-zip');

var args = {};
args.env = 'dev';
if(process.argv.length > 2) {
    var arr = process.argv.slice(2);
    args.target = arr[0];
    for (var i = 0; i < arr.length; i++) {
        var argName = arr[i];
        if(argName.match(/-\w+/i)) {
            args[argName.slice(1)] = arr[i + 1];
        }
    }
}

var pluginName = 'so-css';
var outDir = args.target == 'build:dev' ? '.' : 'dist';

gulp.task('clean', function () {
    if( outDir != '.') {
        del([outDir]);
    }
});

gulp.task('version', ['clean'], function() {
    if(typeof args.v == "undefined") {
        console.log("version task requires version number argument.");
        console.log("E.g. gulp release 1.2.3");
        return;
    }
    return gulp.src([pluginName + '.php', 'readme.txt'])
        .pipe(replace(/(Stable tag:).*/, '$1 '+args.v))
        .pipe(replace(/(Version:).*/, '$1 '+args.v))
        .pipe(replace(/(define\('SOCSS_VERSION', ').*('\);)/, '$1'+args.v+'$2'))
        .pipe(replace(/(define\('SOCSS_JS_SUFFIX', ').*('\);)/, '$1.min$2'))
        .pipe(gulp.dest('tmp'));
});

gulp.task('less', ['clean'], function() {
    return gulp.src(
        [
            'css/**/*.less'
        ],
        {base: '.'})
        .pipe(less({paths: ['css'], compress: args.target == 'build:release'}))
        .pipe(gulp.dest('tmp'));
});

gulp.task('concat', ['clean'], function () {

});

gulp.task('minify', ['concat'], function () {
    return gulp.src(
        [
            'js/**/*.js',
            '!{node_modules,node_modules/**}',  // Ignore node_modules/ and contents
            '!{tests,tests/**}',                // Ignore tests/ and contents
            '!{tmp,tmp/**}'                     // Ignore dist/ and contents
        ], {base: '.'})
        // This will output the non-minified version
        .pipe(gulp.dest('tmp'))
        .pipe(rename({ suffix: '.min' }))
        .pipe(uglify())
        .pipe(gulp.dest('tmp'));
});

gulp.task('copy', ['version', 'less', 'minify'], function () {
    //Just copy remaining files.
    return gulp.src(
        [
            '**/!(*.js|*.less)',                // Everything except .js and .less files
            'lib/**/*.*',                       // libraries used at runtime
            '!{node_modules,node_modules/**}',  // Ignore node_modules/ and contents
            '!{tests,tests/**}',                // Ignore tests/ and contents
            '!{tmp,tmp/**}',                    // Ignore tmp/ and contents
            '!phpunit.xml',                     // Not the unit tests configuration file.
            '!' + pluginName + '.php',          // Not the base plugin file. It is copied by the 'version' task.
            '!readme.txt',                      // Not the readme.txt file. It is copied by the 'version' task.
            '!package.json'                     // Not the package.json file.
        ], {base: '.'})
        .pipe(gulp.dest('tmp'));
});

gulp.task('move', ['copy'], function () {
    return gulp.src('tmp/**')
        .pipe(gulp.dest(outDir + '/' + pluginName));
});

gulp.task('build:release', ['move'], function () {
    del(['tmp']);
    var versionNumber = args.hasOwnProperty('v') ? args.v : 'dev';
    return gulp.src(outDir + '/**/*')
        .pipe(zip(pluginName + '.' + versionNumber + '.zip'))
        .pipe(gulp.dest(outDir));
});

gulp.task('build:dev', ['less'], function () {
    console.log('Watching LESS files...');
    gulp.watch([
        'admin/**/*.less',
        'base/**/*.less',
        'widgets/**/*.less',
        '!widgets/**/styles/*.less'
    ], ['less']);
});

gulp.task('default', ['build:release'], function () {

});