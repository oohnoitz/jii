import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'
import path from 'path'
import del from 'del'
import runSequence from 'run-sequence'
import babel from 'babel-core/register'

const plugins = gulpLoadPlugins()
const assets = require('./assets')

const paths = {
  js: ['./**/*.js', '!coverage/**', '!dist/**', '!node_modules/**', '!static/**', '!test/**'],
}

gulp.task('clean', () =>
  del(['dist/**', 'coverage/**', '!dist', '!coverage'])
)

gulp.task('assets', () => {
  gulp.src(assets.css)
    .pipe(plugins.newer('dist/public/assets/css'))
    .pipe(plugins.concat('app.css'))
    .pipe(plugins.minifyCss())
    .pipe(gulp.dest('dist/public/assets/css'))
    .pipe(plugins.zopfli())
    .pipe(gulp.dest('dist/public/assets/css'))

  gulp.src(assets.js)
    .pipe(plugins.newer('dist/public/assets/js'))
    .pipe(plugins.concat('app.js'))
    .pipe(plugins.uglify())
    .pipe(gulp.dest('dist/public/assets/js'))
    .pipe(plugins.zopfli())
    .pipe(gulp.dest('dist/public/assets/js'))

  gulp.src(assets.fonts)
    .pipe(plugins.newer('dist/public/assets/fonts'))
    .pipe(gulp.dest('dist/public/assets/fonts'))
    .pipe(plugins.zopfli())
    .pipe(gulp.dest('dist/public/assets/fonts'))

  gulp.src('static/assets/images/*')
    .pipe(plugins.newer('dist/public/assets/images'))
    .pipe(plugins.imagemin())
    .pipe(gulp.dest('dist/public/assets/images'))
})

gulp.task('babel', () => {
  const sourcemaps = {
    includeContent: false,
    sourceRoot(file) {
      return path.relative(file.path, __dirname)
    }
  }

  return gulp.src([...paths.js, '!gulpfile.babel.js'], { base: '.' })
    .pipe(plugins.newer('dist'))
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.babel())
    .pipe(plugins.sourcemaps.write('.', sourcemaps))
    .pipe(gulp.dest('dist'))
})

gulp.task('nodemon', ['assets', 'babel'], () =>
  plugins.nodemon({
    script: path.join('dist', 'server.js'),
    ext: 'js',
    ignore: ['node_modules/**/*.js', 'dist/**/*.js'],
    tasks: ['assets', 'babel'],
  })
)

gulp.task('serve', ['clean'], () => runSequence('nodemon'))
gulp.task('build', cb => runSequence('clean', ['assets', 'babel'], cb))
