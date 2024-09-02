(function ($) {
  init();

  const AJAX_ACTION = 'action_network';

  const bxSliderConfig = {
    pager: false,
    responsive: true,
    controls: false,
    touchEnabled: false,
    infiniteLoop: false,
    adaptiveHeight: false,
  };

  let $slider;

  /**
   * Initiate UI changes that necessary
   */
  function prepareUI() {
    // Initialize bxSliders
    $('form.home__org-form-body-wrap').each(function () {
      $slider = $('.form-slides', $(this)).bxSlider(bxSliderConfig);
    });
  }

  /**
   * Set relevant event listeners
   */
  function bindEvents() {
    /**
     * When we've reached third slide 'Next' becomes a submit button
     */
    $('.home__org-nav-next').on('click', function (e) {
      e.preventDefault();

      const $form = $(this).closest('form');
      const slideIndexBeforeNextStep = $slider.getCurrentSlide();

      // 'Autofill' user's first name on step 2
      if (0 === slideIndexBeforeNextStep) {
        // Check if user entered information to ALL fields
        if (!validateFirstStep($form)) {
          setErrors($form);
          return;
        }

        clearErrors($form);

        const firstName = $('[name="given_name"]', $form).val();

        $('.home__org-form-first-name').html(firstName);
      }

      // Submit the form just before the last page.
      // Index for the slider is zero-based.
      // Index '2' is slide '3'
      if (2 === slideIndexBeforeNextStep) {
        $form.submit();
      } else {
        // Go to next slide
        $slider.goToNextSlide();

        // Update 'pill' shape progress indicators
        updateSliderProgress($form);
      }
    });

    $('form.home__org-form-body-wrap').on('submit', function (e) {
      e.preventDefault();

      const $form = $(this);
      const $nextButton = $('.home__org-nav-next', $form);
      const formData = $form.serializeArray();
      const data = {
        action: AJAX_ACTION,
        data: formData,
        current_language: currentLanguage ? currentLanguage.language : 'en',
      };

      $form.addClass('loading');

      $.ajax(mosaicUData.ajaxUrl, {
        method: 'POST',
        data: data,
        /**
         *
         * @param response
         * @param {string} response.data.response.html
         */
        success: function (response) {
          $('.home__org-slide--avail .home__org-avail-list-wrap').html(
            response.data.response.html
          );

          // This resolves the resizing issue that occurs
          // where content is cut off.
          $slider.redrawSlider();

          // Go to next slide
          $slider.goToNextSlide();

          // Update 'pill' shape progress indicators
          updateSliderProgress($form);

          setTimeout(() => {
            $form.removeClass('loading');
          }, 500);
        },
        error: function (error, textStatus, errorThrown) {
          // Go to next slide
          $slider.goToNextSlide();

          // Update 'pill' shape progress indicators
          updateSliderProgress($form);

          $form.removeClass('loading');
        },
      });
    });

    // Handle submitting latest campaign form on homepage
    $('form.new-hero__form-wrap').on('submit', function (e) {
      e.preventDefault();

      const $form = $(this);
      const formData = $form.serializeArray();
      const formRedirectURL = $form.find('input[type="hidden"]').val();
      const $submitButton = $form.find('button[type="submit"]');

      const ajaxData = {
        action: AJAX_ACTION,
        data: formData,
        form_key: '2023-homepage-form',
        // This value is retrieved form a localized script that is set on page load
        current_language: currentLanguage ? currentLanguage.language : 'en',
      };

      // Remove if any error previously occurred
      $form.removeClass('error');

      // Remove if "success" form submission occurred
      // The user should get here but just incase
      $form.addClass('success');

      // Set loading state
      $form.addClass('loading');

      // Disable button while form is submitting
      $submitButton.attr('disabled', true);

      $.ajax(mosaicUData.ajaxUrl, {
        method: 'POST',
        data: ajaxData,
        success: function (response) {
          // Remove loading state
          $form.removeClass('loading');

          // Mark form submission was a success
          $form.addClass('success');

          // Redirect user to "success" confirmation URL
          if (formRedirectURL) {
            window.location.href = formRedirectURL;
          }

          // Enable button
          $submitButton.prop('disabled', false);
        },
        error: function (error) {
          console.error(error);

          // Remove loading state
          $form.removeClass('loading');

          // Mark an error occurred
          $form.addClass('error');

          // Enable button
          $submitButton.prop('disabled', false);
        },
      });
    });
  }

  /**
   * Validate the first step of the form to ensure user has added.
   *
   * @param {any} $form Form jQuery Element we want to validate
   *
   * @return {boolean}
   */
  function validateFirstStep($form) {
    const $inputs = $(
      '.home__org-slide--form :input:not(.home__org-form-checkbox)',
      $form
    );

    return (
      // Filled out fields MUST equal to the number of fields available
      $inputs
        // Filter out fields that HAVE been filled
        .filter(function () {
          // The field MUST have a value (either select or text input)
          return $(this).val();
        }).length === $inputs.length
    );
  }

  /**
   * Set error classes and message
   *
   * @param {any} $form Form jQuery Element we want to set errors for
   */
  function setErrors($form) {
    const $inputs = $(
      '.home__org-slide--form :input:not(.home__org-form-checkbox)',
      $form
    );
    const $errorMessage = $('.home__org-error-wrap', $form);

    $inputs
      // Get fields are empty
      .filter(function () {
        // The field MUST have a value (either select or text input) for it to be valid
        return !$(this).val();
      })
      .addClass('error_input');

    $errorMessage.show();
  }

  /**
   * Remove error classes and message
   *
   * @param $form
   */
  function clearErrors($form) {
    const $inputs = $('.home__org-slide--form :input', $form);
    const $errorMessage = $('.home__org-error-wrap', $form);

    $inputs.removeClass('error_input');
    $errorMessage.hide();
  }

  /**
   * Handle updating slider progress by updating UI as user
   * progresses through the steps in the form.
   *
   * @param $form
   */
  function updateSliderProgress($form) {
    $('.home__org-pag', $form).each(function (index) {
      // Ignore any indicators past the current slide
      if (index > $slider.getCurrentSlide()) {
        return;
      }

      $(this).addClass('home__org-pag--complete');
    });

    const $nextButton = $('.home__org-nav-next', $form);
    const slideIndexAfterNextStep = $slider.getCurrentSlide();

    if (slideIndexAfterNextStep === $slider.getSlideCount() - 1) {
      $nextButton.css({ opacity: 0 });
      $nextButton.prop('disabled', true);
    }
  }

  function init() {
    $(window).on('load', function () {
      prepareUI();
      bindEvents();
    });
  }
})(jQuery);
