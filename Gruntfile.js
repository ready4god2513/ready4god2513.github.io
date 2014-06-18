'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      less: {
        files: ['public/css/**'],
        tasks: ['less:development']
      },
      js: {
        files: ['public/js/src/**'],
        tasks: ['uglify:js']
      }
    },

    uglify: {
      options: {
        beautify: true,
        mangle: false,
        compress: false
      },
      js: {
        files: {
          'public/js/app-min.js': [
            'public/lib/masonry/dist/masonry.pkgd.js',
            'public/lib/imagesloaded/imagesloaded.js',
            'public/lib/angular-masonry/angular-masonry.js',
            'public/js/src/app.js',
            'public/js/src/*.js'
          ]
        }
      }
    },

    less: {
      development: {
        options: {
          paths: ['public/css'],
          compress: true,
          strictImports: true,
          sourceMap: true,
        },
        files: {
          'public/css/app.css': 'public/css/styles.less'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.registerTask('default', ['watch']);

};