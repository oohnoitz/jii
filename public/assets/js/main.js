(function (factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'tmpl',
      'jquery',
      './jquery.fileupload-validate'
    ], factory);
  } else {
    factory(
      window.jQuery,
      window.Handlebars
    );
  }
}(function($, Handlebars) {
  'use strict';

  $.blueimp.fileupload.prototype._specialOptions.push(
    'filesContainer',
    'uploadTemplateId',
    'downloadTemplateId'
  );

  $.widget('jii.uploader', $.blueimp.fileupload, {
    options: {
      title: document.title,
      autoUpload: false,
      maxChunkSize: 0,
      uploadTemplateId: 'upload-template',
      downloadTemplateId: 'download-template',
      filesContainer: '#files',
      dataType: 'json',

      getNumberofFiles: function() {
        return this.filesContainer.children().length;
      },

      getUploadResponse: function(data) {
        if (data.result) {
          return data.result;
        }

        return [];
      },

      // callback for dealing with files added to the uploader
      add: function(e, data) {
        var $this = $(this),
          that = $this.data('jii-uploader'),
          options = that.options,
          files = data.files,
          queue = $('#browse-file-button'),
          existingFiles = options.existingFiles || [];

        data
          .process(function() {
            return $this.uploader('process', data);
          })
          .always(function() {
            data.context = that._renderUpload(files).data('data', data);
            options.filesContainer[
              options.prependFiles ? 'prepend' : 'append'
            ](data.context);

            that._reflow(data.context);
            that._renderTitle(false);
            that._transition(data.context)
              .done(function() {
                if (
                  (that._trigger('added', e, data) !== false) &&
                  (options.autoUpload || data.autoUpload) &&
                  (data.autoUpload !== false) &&
                  !(data.files.error)
                ) {
                  data.submit();
                }

                var file = data.files[0];
                if ('error' in file) {
                  data.context
                    .find('.file-remove')
                    .hide();

                  data.context
                    .find('.file-error')
                    .text(file.message)
                    .show();
                }
              });
          });
      },

      // callback for the start of each file upload request
      send: function(e, data) {
        var that = $(this).data('jii-uploader');

        if (data.context && data.dataType && data.dataType.substr(0, 6) === 'iframe') {
          if (!$.support.transition) {
            data.context
              .find('.progress').find('.determinate')
              .addClass('indeterminate').removeClass('determinate')
              .css('width', '100%');
          }
        }

        return that._trigger('sent', e, data);
      },

      // callback for successful uploads
      done: function(e, data) {
        var that = $(this).data('jii-uploader'),
          getUploadResponse = data.getUploadResponse || that.options.getUploadResponse,
          progressBar = data.context.find('.progress .determinate'),
          files = getUploadResponse(data),
          file = files || {
            error: 'Empty Upload Result',
            message: 'No upload result response found.'
          };

        if ('error' in file) {
          data.context
            .find('.file-error')
            .text(file.message)
            .show();
        } else {
          data.context
            .find('.file-download')
            .show();

          data.context
            .find('.download-link')
            .attr('href', file.url)
            .show();
        }

        if (!$.support.transition) {
          data.context
            .find('.processing')
            .hide();
        }
      },

      // callback for failed uploads
      fail: function(e, data) {
        data.context
          .each(function(index) {
            var file = data.files[index];
            file.error = file.error || data.errorThrown || true;
            console.log(file.error);
          });
      },

      // callback for upload progress events
      progress: function(e, data) {
        if (data.context) {
          var percentage = Math.floor(data.loaded / data.total * 100);
          if (percentage < 100) {
            data.context
              .find('.progress')
              .attr('aria-valuenow', percentage)
              .show()
              .find('.determinate')
              .css('width', percentage + '%');
          } else {
            data.context
              .find('.progress')
              .hide();

            data.context
              .find('.processing')
              .show();
          }

          data.context
            .find('.file-remove')
            .hide();
        }
      },

      // callback for global upload progress events
      progressall: function(e, data) {
        var $this = $(this),
          time = $this.find('.global-upload-time'),
          rate = $this.find('.global-upload-rate');

        $this.data('jii-uploader')._renderTitle(false, data);

        time.find('span').html(
          $this.data('jii-uploader')._renderTime(data)
        );

        rate.find('span').html(
          $this.data('jii-uploader')._renderRate(data)
        );
      },

      start: function(e) {
        var $this = $(this);
        $this.data('jii-uploader')._renderTitle(false);
      },

      stop: function(e) {
        var $this = $(this);
        $this.data('jii-uploader')._renderTitle(true);
      },

      destroy: function(e, data) {}
    },

    _renderTemplate: function(func, files) {
      if (!func) {
        return $();
      }

      var result = func({
        files: files,
        options: this.options
      });

      if (result instanceof $) {
        return result;
      }

      return $(this.options.templatesContainer)
        .html(result)
        .children();
    },

    _renderUpload: function(files) {
      return this._renderTemplate(this.options.uploadTemplate, files);
    },

    _reflow: function(node) {
      return $.support.transition && node.length && node[0].offsetWidth;
    },

    _transition: function(node) {
      var dfd = $.Deferred();

      if ($.support.transition) {
        node.on($.support.transition.end, function(e) {
          if (e.target === node[0]) {
            node.unbind($.support.transition.end);
            dfd.resolveWith(node);
          }
        });
      } else {
        dfd.resolveWith(node);
      }

      return dfd;
    },

    _formatRate: function(bitrate) {
      if (typeof bitrate !== 'number') {
        return '';
      }
      if (bitrate >= 8589934592) {
        return (bitrate / 107374824 / 8).toFixed(2) + ' GB/s';
      }
      if (bitrate >= 12388608) {
        return (bitrate / 1048576 / 8).toFixed(2) + ' MB/s';
      }
      if (bitrate >= 8192) {
        return (bitrate / 1024 / 8).toFixed(2) + ' KB/s';
      }
      if (bitrate <= 0) {
        return 0;
      }

      return (bitrate / 8).toFixed(2) + ' bytes/s';
    },

    _formatTime: function(seconds) {
      if (seconds < 0) {
        seconds = 0;
      }

      var date = new Date(seconds * 1000),
        days = Math.floor(seconds / 86400);

      return (days ? days + 'd ' : '') +
        ('0' + date.getUTCHours()).slice(-2) + ':' +
        ('0' + date.getUTCMinutes()).slice(-2) + ':' +
        ('0' + date.getUTCSeconds()).slice(-2);
    },

    _renderRate: function(data) {
      return this._formatRate(data.bitrate);
    },

    _renderTime: function(data) {
      return this._formatTime(
        (data.total - data.loaded) * 8 / data.bitrate
      );
    },

    _renderTitle: function(done, data) {
      if (done) {
        document.title = '(✔) ' + this.options.title;
      } else {
        if (data) {
          var percentage = Math.floor(data.loaded / data.total * 100);
          if (percentage < 100) {
            document.title = '(' + percentage + '%) ' + this.options.title;
          } else {
            document.title = '(...) ' + this.options.title;
          }
        } else {
          document.title = this.options.title;
        }
      }
    },

    _startHandler: function(e) {
      e.preventDefault();
      $('.file-item').each(function(index, file) {
        var item = $(file);
        var data = item.data('data');
        var name = item.find('.filename')[0];

        data.files[0].uploadName = name.value;
        name.readOnly = true;

        if (data && data.submit && !data.jqXHR && !data.files.error && data.submit()) {
          // waiting for things to happen
        }
      });
    },

    _cancelHandler: function(e) {
      var template = $(e.currentTarget).closest('.file-item'),
        data = template.data('data') || {},
        that = this;

      template.slideUp('fast', function() {
        if (data.jqXHR) {
          data.jqXHR.abort();
        }

        template.remove();
      });
    },

    _initTemplate: function() {
      var options = this.options;

      options.templatesContainer = this.document[0].createElement(
        options.filesContainer.prop('nodeName')
      );

      if (Handlebars && options.uploadTemplateId) {
        var source = $('#' + options.uploadTemplateId).html();
        options.uploadTemplate = Handlebars.compile(source);
      }
    },

    _initFileContainer: function() {
      var options = this.options;

      if (options.filesContainer === undefined) {
        options.filesContainer = this.element.find('#files');
      } else if (!(options.filesContainer instanceof $)) {
        options.filesContainer = $(options.filesContainer);
      }
    },

    _initHandlebarHelpers: function() {
      Handlebars.registerHelper('formatFileSize', function(bytes) {
        if (typeof bytes !== 'number') {
          return '';
        }
        if (bytes >= 1073741824) {
          return (bytes / 1073741824).toFixed(1) + ' GB';
        }
        if (bytes >= 1048576) {
          return (bytes / 1048576).toFixed(1) + ' MB';
        }
        return (bytes / 1024).toFixed(0) + ' KB';
      });
    },

    _initEventHandlers: function() {
      var uploadButton = $('#upload-button');

      this._super();
      this._on(
        uploadButton, {
          'click': this._startHandler
        }
      );
      this._on(
        this.options.filesContainer, {
          'click .file-remove': this._cancelHandler
        }
      );
    },

    _initSpecialOptions: function() {
      this._super();
      this._initFileContainer();
      this._initTemplate();
    },

    _create: function() {
      this._super();
      this._initHandlebarHelpers();
    }
  });
}));

$(function() {
  'use strict';

  //set up our file upload script
  $("#uploader").uploader({
    url: $("#uploader").data("path"),
    maxFileSize: $("#uploader").data("max-size")
  });
});
