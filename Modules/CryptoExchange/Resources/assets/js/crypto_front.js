"use strict";

function restrictNumberToPrefdecimalOnInput(e)
{
	var type = 'crypto';
	restrictNumberToPrefdecimal(e, type);
}

function formatNumberToPrefDecimal(num = 0)
{
	let decimalFormat = decimalPreferrence;
	num = ((Math.abs(num)).toFixed(decimalFormat));
	return num;
}

function isNumber(evt)
{
    var evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }
    return true;
}

$('#copyButton, #merchantAddress').on('click', function () {
	let address = $('#merchantAddress').text();
	let elem = document.createElement("textarea");
	document.body.appendChild(elem);
	elem.value = address;
	elem.select();
	document.execCommand("copy");
	document.body.removeChild(elem);
	$('#copyButton').addClass('d-none');
	$('.copyText').removeClass('d-none');
});

if ($('.container-page').find('#crypto-front-initiate').length) {
	function formatState (state) {
		if (!state.id) { return state.text; }
		var baseUrl = SITE_URL+'/public/uploads/currency_logos/';
		var optimage = $(state.element).attr('data-thumbnail');
		var imgUrl = baseUrl + optimage;
		var $state = $(
		'<span ><img class="c-dimension" src="'+ imgUrl +'" /> ' + state.text + '</span>'
		);
		return $state;
	}

	$("#from_currency").select2({
		minimumResultsForSearch: -1,
		templateResult: formatState,
		language: {
	      noResults: function() {
	        return noResult;
	      },
	    }
	});

	$("#to_currency").select2({
		minimumResultsForSearch: -1,
		templateResult: formatState,
		language: {
	      noResults: function() {
	        return noResult;
	      },
	    }
	});

	$(document).on('change', "#from_currency", function () {
		beforeLoad();
	    var fromCurrencyId = $("#from_currency").val();
	    var type = $("#from_type").val();
	    getCurrenciesExceptFromCurrencyType(fromCurrencyId, type);
	});

	$(document).on('change', "#to_currency", function () {
		beforeLoad();
	    var fromCurrencyId = $("#from_currency").val();
	    var toCurrencyId = $("#to_currency").val();
	    var sendAmount = $("#send_amount").val();
	    getDirectionAmount(fromCurrencyId, toCurrencyId, sendAmount);
	});

	$(document).on('keyup', '#send_amount', $.debounce(1200, function(e) {
		beforeLoad();
	    var fromCurrencyId = $("#from_currency").val();
	    var toCurrencyId = $("#to_currency").val();
	    var sendAmount = $("#send_amount").val();
	    getDirectionAmount(fromCurrencyId, toCurrencyId, sendAmount);
	}));


	$(document).on('keyup', '#get_amount', $.debounce(1200, function(e) {
	    var fromCurrencyId = $("#from_currency").val();
	    var toCurrencyId = $("#to_currency").val();
	    var getAmount = $("#get_amount").val();
	    beforeLoad(getAmount);
	    getDirectionAmount(fromCurrencyId, toCurrencyId, null, getAmount);
	}));

	function beforeLoad( getAmount = null ) {
		$('.rate').text('');
	    $('.exchange_fee').text('');
	    $('.send_amount_error').text('');
	    $('.dot').addClass('display-hide');
	    $('.dot-message').removeClass('h-9p');
	    $("#crypto_buy_sell_button").attr("disabled", true);
		( getAmount ) ? $("#send_amount").val('-') : $("#get_amount").val('-');
	}

	function getCurrenciesExceptFromCurrencyType(fromCurrencyId, type) {
	    var token = $("#token").val();
	    if (fromCurrencyId && type) {
	        $.ajax({
	            method: "GET",
	            url: directionListUrl,
	            dataType: "json",
	            cache: false,
	            data: {
	                "_token": token,
	                'type': type,
	                'from_currency_id': fromCurrencyId,
	            }
	        })
	        .done(function (response)
	        {
	            var toOptions = '';
	            $.each(response.directionCurrencies, function(key, value)
	            {
	                toOptions += `<option value="${value.id}" data-thumbnail="${value.logo}" >${value.code}</option>`
	            });
	            $('#to_currency').html(toOptions);
	            var fromCurrencyId = $("#from_currency").val();
	            var toCurrencyId = $("#to_currency").val();
	            var sendAmount = $("#send_amount").val();
	            getDirectionAmount(fromCurrencyId, toCurrencyId, sendAmount);
	        });
	    }
	}

	function getDirectionAmount(fromCurrencyId, toCurrencyId, sendAmount=null, getAmount=null)
	{
	    var token = $("#token").val();
	    if (fromCurrencyId && toCurrencyId) {
	        $.ajax({
	            method: "GET",
	            url: directionAmountUrl,
	            dataType: "json",
	            cache: false,
	            data: {
	                "_token": token,
	                'from_currency_id': fromCurrencyId,
	                'to_currency_id': toCurrencyId,
	                'send_amount': sendAmount,
	                'get_amount': getAmount,
	            },
	            beforeSend: function (xhr) {
	                $("#crypto_buy_sell_button").attr("disabled", true);
	            },
	        })
	        .done(function (response)
	        {
                $('.send_amount_error').text('');
	            $('#send_amount').val(response.success.send_amount);
	            $('#get_amount').val(response.success.get_amount);
	            $('.rate').text(response.success.exchange_rate);
	            $('.exchange_fee').text(response.success.exchange_fee);
	            if (response.success.status == 200) {
	                $('#crypto_buy_sell_button').attr('disabled', false);
	                $('.dot').addClass('display-hide');
	                $('.dot-message').removeClass('h-9p');
	            } else {
	                $('.send_amount_error').addClass('error').text(response.success.message);
	                $('.dot').removeClass('display-hide');
	                $('.dot-message').addClass('h-9p');
	                $('#crypto_buy_sell_button').attr('disabled', true);
	            }
	        });
	    } else {
	 		$('.send_amount_error').addClass('error').text(directionNotAvaillable);
            $('.dot').removeClass('display-hide');
            $('.dot-message').addClass('h-9p');
	        $('#crypto_buy_sell_button').attr('disabled', true);
	        $('#get_amount').val(0);
	        $('.rate').text('');
	        $('.exchange_fee').text('');
	    }
	}

	$(document).on('click', ".crypto", function ()
	{
		beforeLoad();
	    var type = $(this).attr('data-type');
	    $('#crypto_address-error').hide();
	    $('.send_amount_error').text('');
	    if (type == 'crypto_swap') {
	        $(".crypto_swap").addClass('active');
	        $(".crypto_buy").removeClass('active');
	        $(".crypto_swap_svg").addClass('active-svg');
	        $(".crypto_buy_svg").removeClass('active-svg');
	        $(".switch-box").addClass('display-hide');
	    } else {
	        $(".crypto_swap").removeClass('active');
	        $(".crypto_buy").addClass('active');
	        $(".switch-box").removeClass('display-hide');
	        $(".crypto_swap_svg").removeClass('active-svg');
	        $(".crypto_buy_svg").removeClass('active-svg');
	    }
	    $("#from_type").val(type);
	    $("#crypto_address").val('');
	    getCurrenciesByType(type);
	});

	function getCurrenciesByType(directionType)
	{
	    var token = $("#token").val();
	    if (directionType) {
	        $.ajax({
	            method: "GET",
	            url: directionTypeUrl,
	            dataType: "json",
	            cache: false,
	            data: {
	                "_token": token,
	                'direction_type': directionType,
	            }
	        })
	        .done(function (response)
	        {
	            let fromOptions = '';
	            $.each(response.fromCurrencies, function(key, value)
	            {
	                fromOptions += `<option value="${value.from_currency.id}" data-thumbnail="${value.from_currency.logo}" >${value.from_currency.code}</option>`;
	            });
	            $('#from_currency').html(fromOptions);
	            let toOptions = '';
	            $.each(response.toCurrencies, function(key, value)
	            {
	                toOptions += `<option value="${value.id}" data-thumbnail="${value.logo}" >${value.code}</option>`;
	            });
	            $('#to_currency').html(toOptions);
	            let text = (response.status == '401') ? directionNotAvaillable : '' ;
	            $('.direction_error').addClass('error').text(text);
	            let fromCurrencyId = $("#from_currency").val();
	            let toCurrencyId = $("#to_currency").val();
	            let sendAmount = $("#send_amount").val();
	            getDirectionAmount(fromCurrencyId, toCurrencyId, sendAmount);
	        });
	    }
	    submitText();
	}

	function submitText()
	{
	    var type = $("#from_type").val();
	    if (type == 'crypto_buy') {
	        $('#rp_text').text(buyText);
	    } else if (type == 'crypto_sell') {
	        $('#rp_text').text(sellText);
	    } else {
	        $('#rp_text').text(exchangeText);
	    }
	}

	$(window).on('load', function (e)
	{
		beforeLoad();
	    var previousUrl = localStorage.getItem("previousUrl");
	    if(confirmationUrl == previousUrl) {
	    	var exchangeType = localStorage.getItem("exchangeType");
	    	$("#from_type").val(exchangeType);
	    	getCurrenciesByType(exchangeType);
	    	if (exchangeType != 'crypto_swap') {
	    		$(".crypto_swap").removeClass('active');
	            $(".crypto_buy").addClass('active');
	            $(".switch-box").removeClass('display-hide');
	    	}
	    	submitText();
	        localStorage.removeItem("previousUrl");
	        localStorage.removeItem("exchangeType");
	    } else {
		    let fromType = $('#from_type').val();
		    if (fromType == 'crypto_swap')  {
		        $(".switch-box").addClass('display-hide');
		    } else {
		        $(".switch-box").removeClass('display-hide');
		    }
		    var fromCurrencyId = $("#from_currency").val();
		    var type = $("#from_type").val();
		    var toCurrencyId = $("#to_currency").val();
		    var sendAmount = $("#send_amount").val();
		    if (type == 'crypto_buy') {
		    	getCurrenciesByType(type);
		    } else {
		    	getDirectionAmount(fromCurrencyId, toCurrencyId, sendAmount);
		    }
	    	submitText();
	    }
	});

	$(document).on('click', '.switch-box', function (){
		beforeLoad();
		var type = $("#from_type").val();
		if (type == 'crypto_buy') {
			var exchangeType = 'crypto_sell';
		} else {
			var exchangeType = 'crypto_buy';
		}
		$("#from_type").val(exchangeType);
		getCurrenciesByType(exchangeType);
	});



	$(document).on('click', '.btn-toggle', function (){
	    $(this).find('.btns').toggleClass('active');
	    if ($(this).find('.btn-swich').length>0) {
	        $(this).find('.btns').toggleClass('btn-swich');
	    }
	    $(this).find('.btns').toggleClass('btn-defaults');
	    $('.send_amount_error').text('');
	    var type = $('.btn-swich').attr('data-type');
	    $("#from_type").val(type);
	    getCurrenciesByType(type);
	});

	$(document).on('submit', '#crypto-send-form', function() {
	    $("#crypto_buy_sell_button").attr("disabled", true);
	    $(".spinner").removeClass('exchange-display');
    	setTimeout(function(){
            $(".spinner").addClass('exchange-display');
            $("#crypto_buy_sell_button").attr("disabled", false);
        },1000);
	});

}

if ($('.container-page').find('#crypto-exchange-verification').length) {
	function exchangeBack() {
	    localStorage.setItem("previousUrl", document.URL);
	    localStorage.setItem("exchangeType", from_type);
	    localStorage.setItem("fromCurrency", fromCurrencyId);
	    localStorage.setItem("toCurrency", toCurrencyId);
	    history.back();
	}

    function enableDisableButton()
    {
        if (!hasPhoneError) {
            $('form').find("button[type='submit']").prop('disabled',false);
        } else {
            $('form').find("button[type='submit']").prop('disabled',true);
        }
    }

    $("#phone").intlTelInput({
        separateDialCode: true,
        nationalMode: true,
        preferredCountries: [defaultCountry],
        autoPlaceholder: "polite",
        placeholderNumberType: "MOBILE",
        utilsScript: utilsScriptFile
    });

    function updatePhoneInfo()
    {
        let promiseObj = new Promise(function(resolve, reject)
        {
            $('#defaultCountry').val($('#phone').intlTelInput('getSelectedCountryData').iso2);
            $('#carrierCode').val($('#phone').intlTelInput('getSelectedCountryData').dialCode);

            if ($('#phone').val != '') {
                $("#formattedPhone").val($('#phone').intlTelInput("getNumber").replace(/-|\s/g,""));
            }
            resolve();
        });
        return promiseObj;
    }

    function validateInternaltionalPhoneNumber()
    {
        let promiseObj = new Promise(function(resolve, reject)
        {
            let resolveStatus = false;
            if ($.trim($('#phone').val()) !== '') {
                if (!$('#phone').intlTelInput("isValidNumber") || !isValidPhoneNumber($.trim($('#phone').val()))) {
                    $('#duplicate-phone-error').html('');
                    $('#tel-error').addClass('error').html(validPhoneText);
                    hasPhoneError = true;
                    enableDisableButton();
                } else {
                    resolveStatus = true;
                    $('#tel-error').html('');
                    hasPhoneError = false;
                    enableDisableButton();
                }
            } else {
                $('#tel-error').addClass('error').html(validPhoneText);
                hasPhoneError = false;
                enableDisableButton();
            }
            resolve(resolveStatus);
        });
        return promiseObj;
    }

    function phoneValidityCheck()
    {
        updatePhoneInfo()
        .then(() =>
        {
            validateInternaltionalPhoneNumber()
        });
    }

    function sendSms()
    {
        var phone        = $("#phone").val();
		var carrierCode  = $("#carrierCode").val();
		var token        = $("#token").val();
        if(phone && carrierCode){
            $.ajax({
                method: "GET",
                url: phoneVerificationUrl,
                dataType: "json",
                cache: false,
                data: {
                    "_token": token,
                    'phone': phone,
                    'carrierCode': carrierCode,
                }
            })
            .done(function (response)
            {
                if (response.data.status) {
                    $('#phone').attr('readonly', true);
                    $("#otp_details").show();
                    $("#verification_field").hide();
                    $("#submit_field").show();
                } else {
                    $('#tel-error').html('');
                    $("#phone-config-error").text(phoneConfigText);
                    $('.phone_spinner').addClass('displaynone');
                    $('#phone_verification_next_text').text(nextText);
                }
            });
        }
    }

    $("#phone").on("countrychange", function()
    {
        phoneValidityCheck();
    });

    $("#phone").on('blur', function()
    {
        phoneValidityCheck();
    });

	$("#verify_phone").on('click', function ()
	{
        phoneValidityCheck();
        if(!hasPhoneError) {
            sendSms();
        }
	});

	function validateEmail(email) {
		var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,})+$/;
		if(!regex.test(email)) {
			return false;
		} else {
			return true;
		}
	}

	$(document).on('click', "#verify_email", function(){

	    $('#verify_email').attr('disabled', true);
	    let email = $('#email').val();
	    let token = $("#token").val();
	    let checkEmail = validateEmail(email);
	    if (checkEmail) {
	        $("#email-error").text('');
	        $('.email_spinner').removeClass('displaynone');
	        $('#emil_verification_button_text').text(otpText);
	        $.ajax({
	          method: "GET",
	          url: emailVerificationUrl,
	          dataType: "json",
	          cache: false,
	          data: {
	              "_token": token,
	              'email': email,
	          }
	        })
	        .done(function (response)
	        {
	            if (response.data.status) {
	                $("#otp_details").show();
	                $("#verification_field").hide();
	                $("#submit_field").show();
	                $( "#email" ).prop( "disabled", true );
	            } else {
	                $("#email-error").text(emailConfigText);
                    $("#verify_email").attr('disabled', false);
                    $('#emil_verification_button_text').text(nextText);
	            }
	        });
	    } else {
	        $("#verify_email").attr('disabled', false)
	        $("#email-error").text(validEmailText);
	    }
	});

	$(document).on('click', "#instant", function ()
	{
	    $("#phone_section").show();
	    $("#verification_field").show();
	    $("#unregistered").hide();

	});

	$(document).on('click', "#phone_verification_button", function ()
	{
	    $('.verify_confirm').removeClass('displaynone');
	    $("#phone_verification_button_text").text(verifyingText);
	    var phone = $("#phone").val();
	    var carrierCode  = $("#carrierCode").val();
	    var code = $("#phone_verification_code").val();
	    var token = $("#token").val();
	    $.ajax({
	      method: "GET",
	      url: phoneVerificationSuccessUrl,
	      dataType: "json",
	      cache: false,
	      data: {
	          "_token" : token,
	          'phone' : phone,
	          'carrierCode': carrierCode,
	          'code' : code,
	      }
	    })
	    .done(function (response)
	    {
	        if (!response.status) {
	            $('#code-error').addClass('error').html(response.message);
	            $('#phone_verification_button_text').text(verify);
	            $('.verify_confirm').addClass('displaynone');
	        }
	        if (response.status) {
	            window.location.href = receivingInforUrl;
	        }
	        if (response.status == 500) {
	            $('#code-error').addClass('error').html(otpRequiredText);
	            $('#phone_verification_button_text').text(verify);
	            $('.verify_confirm').addClass('displaynone');
	        }
	    });

	});

	$(document).on('click', "#email_verification_button", function ()
	{
	    $('.verify_confirm').removeClass('displaynone');
	    $('#phone_verification_button_text').text(verifyingText);
	    var phone = $("#email").val();
	    var code = $("#phone_verification_code").val();
	    var token = $("#token").val();
	    $.ajax({
	      method: "GET",
	      url: emailVerificationSuccessUrl,
	      dataType: "json",
	      cache: false,
	      data: {
	          "_token" : token,
	          'email' : phone,
	          'code' : code,
	      }
	    })
	    .done(function (response)
	    {
	        if (!response.status) {
	            $('#code-error').addClass('error').html(response.message);
	            $('.verify_confirm').addClass('displaynone');
	            $('#phone_verification_button_text').text(verify);
	        }
	        if (response.status) {
	            window.location.href = receivingInforUrl;
	        }
	        if (response.status == 500) {
	            $('.verify_confirm').addClass('displaynone');
	            $('#phone_verification_button_text').text(verify);
	            $('#code-error').addClass('error').html(otpRequiredText);
	        }
	    });
	});



	$(document).ready(function()  {
	    new Fingerprint2().get(function(result, components)
	    {
	        $('#browser_fingerprint').val(result);
	    });
	});

	$(document).on('click', '.exchange-confirm-back-btn', function(e) {
	    e.preventDefault();
	    exchangeBack();
	});
}

if ($('.container-page').find('#crypto-receiving-info').length) {

	function exchangeBack() {
	    localStorage.setItem("previousUrl", document.URL);
	    window.history.back();
	}

	$(document).on('click', '.exchange-confirm-back-btn', function(e) {
	    e.preventDefault();
	    exchangeBack();
	});

	$(document).on('submit', '#crypto_buy_sell_from', function() {

	    $("#crypto_buy_sell_button").attr("disabled", true).click(function (e)
	    {
	        e.preventDefault();
	    });
	    $("#spinner").removeClass('displaynone');
	    var pretext = $("#crypto_buy_sell_button_text").text();
	    $("#crypto_buy_sell_button_text").text(nextText);

	    setTimeout(function(){
	        $("#crypto_buy_sell_button").attr("disabled", false);
	    	$("#spinner").addClass('displaynone');
		    $("#crypto_buy_sell_button_text").text(pretext);
        },1000);

	});
}

if ($('.container-page').find('#crypto-transaction-gateway').length) {

	function exchangeBack() {
	    localStorage.setItem("previousUrl", document.URL);
	    window.history.back();
	}

	$(document).on('submit', '#crypto_buy_sell_from', function() {

	    $("#verify_phone").attr("disabled", true);
	    $("#phone_verification_button_text").text(submitText);

	});

	$(document).ready(function() {
	    new Fingerprint2().get(function(result, components) {
	        $('#browser_fingerprint').val(result);
	    });
	});

	$(document).on('click', '.exchange-confirm-back-btn', function(e) {
	    e.preventDefault();
	    exchangeBack();
	});

	$(document).on('click', '.payment_method', function() {
	    var checkboxes = $(this).closest('form').find(':checkbox');
	    checkboxes.prop('checked', $(this).is(':checked'));
	});

	$(document).on('click', '.gateway', function() {
		$(".gateway").removeClass("g5");
	    localStorage.setItem("gateway", this.id);
		$(this).addClass("g5");
		$('#payment_method_id').val(this.id);
	});

	$(window).on('load',function() {
		if ($('#copyTarget').length) {
			var textWidth = $('#copyTarget').val().length;
			$("#copyTarget").width(textWidth*10);
		}
	    var previousUrl = localStorage.getItem("previousUrl");
	    var gateway = localStorage.getItem("gateway");
	    var confirmationUrl = SITE_URL+'/crypto-exchange/payment';
	    if (previousUrl == confirmationUrl) {
	    	$('#'+gateway).click();
	    		localStorage.removeItem("previousUrl");
	    		localStorage.removeItem("gateway");
	    }
	});

    $(document).on('change', '#file', function() {
        let ext = $('#file').val().replace(/^.*\./, '');
        let fileInput = document.getElementById('file');
        const fileTypes = extensions;
        if (!fileTypes.includes(ext)) {
            fileInput.value = '';
            $('.file-error').addClass('error').text(invalidFileText);
            $('#fileSpan').fadeIn('slow').delay(2000).fadeOut('slow');
            return false;
        } else {
            $('.file-error').text('');
            return true;
        }
    })


}

if ($('.container-page').find('#crypto-bank-payment-method').length) {
	function exchangeBack() {
	    localStorage.setItem("previousUrl", document.URL);
	    window.history.back();
	}

	function getBanks()
	{
	    var bank = $('#bank').val();
	    if (bank) {
	        $.ajax({
	            headers:
	            {
	                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
	            },
	            method: "POST",
	            url: bankDetailsUrl,
	            dataType: "json",
	            cache: false,
	            data: {
	                'bank': bank,
	            }
	        })
	        .done(function(response)
	        {
	            if (response.status) {
	                $('#bank_name').html(response.bank.bank_name);
	                $('#account_name').html(response.bank.account_name);
	                $('#account_number').html(response.bank.account_number);

	                if (response.bank_logo) {
	                    $("#bank_logo").html(`<img class="stripe-image" src="${SITE_URL}/public/uploads/files/bank_logos/${response.bank_logo}" class="w-120p" width="120" height="80"/>`);
	                } else {
	                    $("#bank_logo").html(`<img class="stripe-image" src="${SITE_URL}/public/images/payment_gateway/bank.jpg" class="w-120p" width="120" height="80"/>`);
	                }
	            } else {

	                $('#bank_name').html('');
	                $('#bank_branch_name').html('');
	                $('#bank_branch_city').html('');
	                $('#bank_branch_address').html('');
	                $('#swift_code').html('');
	                $('#account_name').html('');
	                $('#account_number').html('');
	            }
	        });
	    }
	}

	$(window).on('load',function() {
	    getBanks();
	});

	$("#bank").change(function() {
	    getBanks();
	});

	$(document).on('change', '#bank', function() {
	    getBanks();
	});

	$(document).on('submit', '#bank_deposit_form', function() {

	    $("#bank_payment").attr("disabled", true);
	    $("#spinner").show();
	    var pretext=$("#deposit-money-text").text();
	    $("#deposit-money-text").text(confirmText);

	    //Make back button disabled and prevent click
	    $('.deposit-bank-confirm-back-btn').attr("disabled", true).click(function (e)
	    {
	        e.preventDefault();
	    });
	    //Make back anchor prevent click
	    $('.deposit-bank-confirm-back-link').click(function (e)
	    {
	        e.preventDefault();
	    });
	    setTimeout(function(){
	        $("#bank_payment").attr("disabled", false);
		    $("#spinner").hide();
		    $("#deposit-money-text").text(pretext);
        },1000);
	});

	$(document).on('click', '.exchange-confirm-back-btn', function(e) {
	    e.preventDefault();
	    exchangeBack();
	});

	$(document).on('change', '#file', function() {
        let ext = $('#file').val().replace(/^.*\./, '');
        let fileInput = document.getElementById('file');
        const fileTypes = extensions;
        if (!fileTypes.includes(ext)) {
            fileInput.value = '';
            $('.file-error').addClass('error').text(invalidFileText);
            $('#fileSpan').fadeIn('slow').delay(2000).fadeOut('slow');
            return false;
        } else {
            $('.file-error').removeClass('error').text('');
            return true;
        }
    })


}

if ($('.container-page').find('#stripe-payment-gateway').length) {

	var forms = document.querySelectorAll('form');
	if (forms.length != 0) {
	    forms[0].addEventListener("click", function(e)
	    {
			if (e.target && e.target.nodeName == "INPUT") {
				hideFormsButFirst();
			}
	    });
	    function hideFormsButFirst()
	    {
			for (var i = 0; i < forms.length; ++i) {
				forms[i].style.display = 'none';
			}
			forms[0].style.display = 'block';
	    }
	    function init()
	    {
	    	hideFormsButFirst();
	    }
	    init();
	}

	$.validator.setDefaults({
	    highlight: function(element) {
	    	$(element).parent('div').addClass('has-error');
	    },
	    unhighlight: function(element) {
	    	$(element).parent('div').removeClass('has-error');
	    },
	    errorPlacement: function (error, element) {
	    	error.insertAfter(element);
	    }
	});

	function disableSumbitCancelButtons()
	{
	    $('.standard-payment-submit-btn, .standard-payment-cancel-btn').attr("disabled", true).click(function (e)
	    {
	        e.preventDefault();
	    });
	    $(".fa-spin").show();
	    $(".standard-payment-cancel-link").click(function (e)
	    {
	        e.preventDefault();
	    });
	    $(".standard-payment-submit-btn-txt").text('Paying...');
	    setTimeout(function(){
	        $('.standard-payment-submit-btn, .standard-payment-cancel-btn').removeAttr("disabled");
	        $(".fa-spin").hide();
	        $('.standard-payment-cancel-link').attr({
	            'href': '#home',
	            'data-toggle': 'tab'
	        });
	        $(".standard-payment-submit-btn-txt").text(goToPaymentText);
	    },10000);
	}

	$('#Stripe').validate(
	{
	    rules:
	    {
	        cardNumber:
	        {
	            required: true,
	        },
	        month:
	        {
	            required: true,
	            maxlength: 2
	        },
	        year:
	        {
	            required: true,
	            maxlength: 2
	        },
	        cvc:
	        {
	            required: true,
	            maxlength: 4
	        },
	    },
	    submitHandler: function(form, e)
	    {
	        e.preventDefault();
	        confirmPayment();
	    }
	});

	function exchangeBack() {
	    localStorage.setItem("previousUrl", document.URL);
	    window.history.back();
	}

	function makePayment()
	{
	    var promiseObj = new Promise(function(resolve, reject)
	    {
	        var cardNumber = $("#cardNumber").val().trim();
	        var month      = $("#month").val().trim();
	        var year       = $("#year").val().trim();
	        var cvc        = $("#cvc").val().trim();
	        var currency   = $('#Stripe').find('input[name="currency"]').val().trim();
	        var amount     = totalAmount;

	        $("#stripeError").html('');
	        if (cardNumber && month && year && cvc) {
	        $.ajax({
	            type: "POST",
	            url: stripePaymentUrl,
	            data:
	            {
	                "_token":  csrfToken,
	                'cardNumber': cardNumber,
	                'month': month,
	                'year': year,
	                'cvc': cvc,
	                'currency': currency,
	                'amount': amount,
	            },
	            dataType: "json",
	            beforeSend: function (xhr) {
	                $(".standard-payment-submit-btn").attr("disabled", true);
	            },
	        }).done(function(response)
	        {
	            if (response.data.status != 200) {
	                $("#stripeError").html(response.data.message);
	                $(".standard-payment-submit-btn").attr("disabled", true);
	                reject(response.data.status);
	                return false;
	            } else {
	                $(".standard-payment-submit-btn").attr("disabled", false);
	                resolve(response.data);
	            }
	        });
	    }
	    });
	    return promiseObj;
	}

	function confirmPayment()
	{
	    makePayment().then(function(result) {
	        var form = $('#Stripe')[0];
	        var formData = new FormData(form);
	        formData.append('_token', csrfToken);
	        formData.append('paymentIntendId', result.paymentIntendId);
	        formData.append('paymentMethodId', result.paymentMethodId);

	        $.ajax({
	            type: "POST",
	            url: stripeUrl,
	            data: formData,
	            processData: false,
	            contentType: false,
	            cache: false,
	            beforeSend: function (xhr) {
	                $(".standard-payment-submit-btn").attr("disabled", true);
	                $(".fa-spin").show();
	                $('.standard-payment-submit-btn').text(submitting);

	            },
	        }).done(function(response)
	        {

	            if (response.data.status != 200) {
	                $(".fa-spin").hide();
	                $(".standard-payment-submit-btn").attr("disabled", true);
	                $("#stripeError").html(response.data.message);
	                return false;
	            } else {
	                window.location.replace(SITE_URL + '/crypto-exchange/success');
	            }
	        });
	    });
	}

	$("#month").change(function() {
	    makePayment();
	});

	$("#year, #cvc").on('keyup', $.debounce(800, function() {
	    makePayment();
	}));

	$("#cardNumber").on('keyup', $.debounce(800, function() {
	    makePayment();
	}));

	// For card number design
	document.getElementById('cardNumber').addEventListener('input', function (e) {
	    var target = e.target, position = target.selectionEnd, length = target.value.length;
	    target.value = target.value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim();
	    target.selectionEnd = position += ((target.value.charAt(position - 1) === ' ' && target.value.charAt(length - 1) === ' ' && length !== target.value.length) ? 1 : 0);
	});

	$(document).on('click', '.exchange-confirm-back-btn', function(e) {
	    e.preventDefault();
	    exchangeBack();
	});

	$(document).on('submit', '#crypto_buy_sell_from', function() {
	    $(".standard-payment-submit-btn").attr("disabled", true);
	    $(".fa-spin").show();
	    setTimeout(function(){
            $(".fa-spin").hide();
            $(".standard-payment-submit-btn").attr("disabled", true);
        },1000);
	});
}

if ($('.container-page').find('#paypal-payment-gateway').length) {
	paypal.Buttons({
	    createOrder: function (data, actions) {
	        // This function sets up the details of the transaction, including the amount and line item details.
	        return actions.order.create({
	            purchase_units: [{
	                amount: {
	                    value: totoalAmount
	                }
	            }]
	        });
	    },
	    onApprove: function (data, actions) {
	        // This function captures the funds from the transaction.
	        return actions.order.capture().then(function (details) {
	            // This function shows a transaction success message to your buyer.
	            window.location.replace(SITE_URL + "/crypto-exchange/paypal-payment/success/" + btoa(details.purchase_units[0].amount.value));
	        });
	    }
	}).render('#paypal-button-container');

	function exchangeBack() {
	    localStorage.setItem("previousUrl", document.URL);
	    window.history.back();
	}

	$(document).on('click', '.exchange-confirm-back-btn', function(e) {
	    e.preventDefault();
	    exchangeBack();
	});
}
