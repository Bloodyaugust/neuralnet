/// <binding ProjectOpened='dev' />
var Mustache = require('mustache');

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      dist: ['public']
    },
    concat: {
      dist: {
        src: ['app/**/*.js'],
        dest: 'public/js/main.js'
      }
    },
    copy: {
      dist: {
        files: [{
          cwd: 'app/',
          expand: true,
          src: ['templates/*'],
          dest: 'public/'
        }, {
          cwd: 'app/',
          expand: true,
          src: ['res/**/*', '!*.{png,jpg,gif,map}'],
          dest: 'public/'
        }, {
          cwd: 'app/',
          expand: true,
          src: ['favicon.ico'],
          dest: 'public/'
        }]
      }
    },
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      dist: {
        files: {
          'public/css/main.css': ['public/css/main.css']
        }
      }
    },
    express: {
      options: {
        script: 'index.js'
      },
      dev: {
        options: {
          args: ['dev']
        }
      },
      dist: {
        options: {
          args: ['dist'],
          background: false
        }
      }
    },
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: 'app/',
          src: 'res/img/**/*.{png,jpg,gif}',
          dest: 'public/'
        }]
      }
    },
    includeHTMLPartials: {
      dev: {
        files: [{
          cwd: 'app/',
          src: ['templates/*.html', '!templates/index.html'],
          dest: 'index.html'
        }]
      }
    },
    includeSource: {
      dev: {
        options: {
          basePath: 'app',
          baseUrl: '/'
        },
        files: {
          'app/index.html': 'app/templates/index.html'
        }
      },
      dist: {
        options: {
          basePath: 'public',
          baseUrl: '/'
        },
        files: {
          'public/index.html': 'app/templates/index.html'
        }
      },
      options: {
        templates: {
          html: {
            html: '<script type="text/html" id="{filePath}">{fileContent}</script>'
          }
        }
      }
    },
    jshint: {
      files: {
        src: ['app/**/*.js', '!app/res/**/*.js']
      }
    },
    sass: {
      dev: {
        options: {
          sourceMap: true
        },
        files: {
          'app/styles/css/main.css': 'app/styles/sass/main.scss'
        }
      },
      dist: {
        options: {
          sourceMap: true
        },
        files: {
          'public/css/main.css': 'app/styles/sass/main.scss'
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'public/js/main.js': ['public/js/main.js']
        }
      }
    },
    watch: {
      html: {
        files: ['app/templates/**/*.html'],
        tasks: ['includeSource:dev', 'wiredep:dev', 'includeHTMLPartials:dev'],
        options: {
          livereload: 35729
        }
      },
      javascript: {
        files: ['!app/**/*.test.js', 'app/**/*.js'],
        tasks: ['jshint'],
        options: {
          livereload: 35729
        }
      },
      sass: {
        files: ['app/styles/**/*.scss'],
        tasks: ['sass:dev'],
        options: {
          livereload: 35729
        }
      }
    },
    wiredep: {
      dev: {
        src: [
          'app/index.html'
        ],
        fileTypes: {
          js: {
            block: /(([\s\t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
            detect: {
                js: /'(.*\.js)'/gi
            },
            replace: {
                js: '\'{{filePath}}\','
            }
          }
        }
      },
      dist: {
        overrides: {
          jquery: {
            main: 'dist/jquery.min.js'
          }
        },
        src: [
          'public/index.html'
        ],
        fileTypes: {
          js: {
            block: /(([\s\t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
            detect: {
                js: /'(.*\.js)'/gi
            },
            replace: {
                js: '\'{{filePath}}\','
            }
          }
        }
      }
    }
  });

  grunt.registerMultiTask('includeHTMLPartials', 'Includes partials(templates) into your main HTML file.', function () {
    var cwd = this.files[0].cwd,
      dest = this.files[0].dest,
      done = this.async(),
      files = this.files[0].src.slice(),
      file = '',
      includeString = '',
      finalHTML = '';

    function constructInclude() {
      if (files.length <= 0) {
        writeInclude();
        done(true);
      } else {
        file = files.pop();
        includeString += Mustache.render('<script type="text/html" id="{{{file}}}">\r\n{{{content}}}\r\n</script>', {file: file, content: grunt.file.read(cwd + file)});
        constructInclude();
      }
    }

    function writeInclude() {
      finalHTML = grunt.file.read(cwd + dest);

      finalHTML = finalHTML.replace('<!-- templates -->', includeString);

      grunt.file.write(cwd + dest, finalHTML);
    }

    constructInclude();
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-include-source');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-wiredep');

  grunt.registerTask('no-default', function () {
    console.log('Default tasks are for the bad kind of lazy programmer. For shame!')
  });

  grunt.registerTask('default', ['no-default']);
  grunt.registerTask('dev', ['express:dev', 'sass:dev', 'jshint', 'includeSource:dev', 'wiredep:dev', 'includeHTMLPartials:dev', 'watch']);
  grunt.registerTask('dist', ['clean', 'sass:dist', 'concat:dist', 'copy:dist', 'includeSource:dist', 'wiredep:dist', 'imagemin:dist', 'uglify:dist', 'cssmin:dist']);
  grunt.registerTask('dist-serve', ['express:dist']);
};
