$(document).one('pageinit', function() {
    // define the runs as a global var and fill it with data once, not in every method
    // it will preserve it's data along the current session
    runs = getRunsObject();
    var runChart;
    //Display runs
    showRuns();
	initChart();
	initNotifications();
	initValidation();
    // Add Handler
    //$('#submitAdd').on('tap', addRun); -> don't add listeners to buttons, rather the form itself (on submit)!!!

    // Edit Handler
    //$('#submitEdit').on('tap', editRun); -> don't add listeners to buttons, rather the form itself (on submit)!!!

    $('#addForm').off('submit').on('submit', submitAddRun); // add run handler
    $('#editForm').off('submit').on('submit', submitEditRun); // edit run handler
    $('.chart-page').off('click').on('click', initChart); // draw chart

    // THESE HANDLERS ARE MOVED IN SEPARATE METHODS BELOW
    // Delete Handler
    //$('#stats').on('tap','#deleteLink', deleteRun);

    // Set Current Handler
    //$('#stats').on('tap','#editLink', setCurrent);

    // Clear Handler
    $('#clearRuns').on('click', clearRuns);

    function initDelete() {
        // clear previous binded events to prevent bubbling
        $('.deleteLink').off('click');

        // assign/reasign the click event for every Delete button
        $('.deleteLink').on('click', function(event) {
            // prevent the native click event for the link
            event.preventDefault();

            //*** "this" is the clicked "Delete" link now ***

            // get the run at the clicked index, delete it and update the local storage
            var runIndex = $(this).attr('data-index');
            deleteRun(runIndex);

            return false;
        });
    }

    function initEdit() {
        // clear previous binded events to prevent bubbling
        $('.editLink').off('click');

        // assign/reasign the click event for every Delete button
        $('.editLink').on('click', function(event) {
            //*** "this" is the clicked "Delete" link now ***

            // get the run at the clicked index, call the "Edit" method with the selected run
            var runIndex = $(this).attr('data-index');
            setEditRun(runIndex);
        });
    }

    function initActions() {
        initDelete();
        initEdit();
    }

	
	$('#chart').unbind('pageinit').bind('pageinit', function() {
		initChart();
	});

    /*
     *Show all runs on homepage
     */
    function showRuns() {
        //Check if empty
        if (runs != '' && runs != null) {
            for (var i = 0; i < runs.length; i++) {
                $('#stats').append('<li class="ui-body-inherit ui-li-static"><strong>Date:</strong>' + runs[i]["date"] +
                    '<br><strong>Distance: </strong>' + runs[i]["Kilometers"] + 'km<div class="controls">' +
                    '<a href="#edit" class="editLink" data-Kilometers="' + runs[i]["Kilometers"] + '" data-index="' + i + '" data-date="' + runs[i]["date"] + '">Edit</a> | ' +
                    '<a href="#" class="deleteLink" data-Kilometers="' + runs[i]["Kilometers"] + '" data-index="' + i + '" data-date="' + runs[i]["date"] + '">Delete</a></li>');
            }

            initActions();

            $('#home').unbind('pageinit').bind('pageinit', function() {
                $('#stats').listview('refresh');
            });
        } else {
            $('#stats').html('<p>You have no logged runs</p>');
        }
    }

	function drawRuns() {
		$('#stats').empty();
		if (runs != '' && runs != null) {
			for (var i = 0; i < runs.length; i++) {
                $('#stats').append('<li class="ui-body-inherit ui-li-static"><strong>Date:</strong>' + runs[i]["date"] +
                    '<br><strong>Distance: </strong>' + runs[i]["Kilometers"] + 'km<div class="controls">' +
                    '<a href="#edit" class="editLink" data-Kilometers="' + runs[i]["Kilometers"] + '" data-index="' + i + '" data-date="' + runs[i]["date"] + '">Edit</a> | ' +
                    '<a href="#" class="deleteLink" data-Kilometers="' + runs[i]["Kilometers"] + '" data-index="' + i + '" data-date="' + runs[i]["date"] + '">Delete</a></li>');
            }

            initActions();
		}
	}
	
    function submitAddRun(event) {
        event.preventDefault();
		if (!$(this).valid())
			return false;
		
        addRun();
		this.reset();
		$.mobile.changePage("#home");
		
        return false;
    };

    function submitEditRun(event) {
        event.preventDefault();

        editRun();
		this.reset();
		$.mobile.changePage("#home");

        return false;
    };

    /*
     *Add a run
     */
    function addRun() {
        //Get form values
        var Kilometers = $('#addKilometers').val();
        var date = $('#addDate').val();

        saveRun(Kilometers, date);

        return false;
    }

    /*
     *Edit a run
     */
    function editRun() {
        //Get form values
        var Kilometers = $('#editKilometers').val();
        var date = $('#editDate').val();
        var runIndex = $('#runIndex').val();

        saveRun(Kilometers, date, runIndex);

        return false;
    }

    function saveRun(Kilometers, date) {
        var runIndex = -1;
        if (arguments.length == 3) // if we have 3 arguments, the third is the run index which means we're updating
            runIndex = arguments[2];

        // create a new run
        var run = {
            date: date,
            Kilometers: parseFloat(Kilometers)
        };

        // if we're passing the run index, means we're updating so just update the run at the given index
        if (runIndex > -1)
            runs[runIndex] = run;
        else // if the run index is 0, means we have a new run record so just push it in the global runs array
            runs.push(run);

        // update the local storage
        localStorage.setItem('runs', JSON.stringify(runs));
		
		drawRuns();
		updateChart();
		$.notify("Run saved");
    }

    /*
     *Delete a run
     */
    function deleteRun(runIndex) {
        if (confirm("Are you sure you want to delete this run data?")) {
            runs.splice(runIndex, 1);
            localStorage.setItem('runs', JSON.stringify(runs));

			drawRuns();
			updateChart();
			$.notify("Run deleted");
        }
    }

    /*
     *Delete all runs
     */

    function clearRuns() {
        if (confirm("Are you sure you want to clear your entire run data?")) {
            window.localStorage.clear();
            localStorage.removeItem('runs');
            runs.splice(runIndex);
            $('#stats').html('<p>You have no logged runs</p>');
			drawRuns();
			updateChart();
			$.notify("All runs cleared");
        }
    }

    // populate the edit form upon clicking "Edit" on a run item
    function setEditRun(runIndex) {
        $('#runIndex').val(runIndex);
        $('#editKilometers').val(runs[runIndex].Kilometers);
        $('#editDate').val(runs[runIndex].date);
    }


    function initChart() {

        if (typeof runChart == 'undefined' || runChart == null) {
            var presets = window.chartColors;
            var options = {
                maintainAspectRatio: false,
                spanGaps: false,
                elements: {
                    line: {
                        tension: 0.000001
                    }
                },
                plugins: {
                    filler: {
                        propagate: false
                    }
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            autoSkip: false,
                            maxRotation: 0
                        }
                    }]
                }
            };


            var ctx = document.getElementById("runChart");
            runChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: generateLabels(),
                    datasets: [{
                        backgroundColor: '#ffffff',
                        borderColor: '#ff0000',
                        data: generateData(),
                        label: 'Distance Covered',
                        fill: false,
                    }]
                },
                options: Chart.helpers.merge(options, {
                    title: {
                        text: 'fill: ' + false,
                        display: false
                    }
                })
            });
			
			updateChart();
        }
    }
	
	function updateChart() {
		if (typeof runChart == 'undefined' || runChart == null) 
			return;
		
		runChart.data.labels = generateLabels();
		runChart.data.datasets[0].data = generateData();
		runChart.update();
	}

    function generateLabels() {
        var labels = [];
        if (runs != '' && runs != null) {
            for (var i = 0; i < runs.length; i++) {
                labels.push(runs[i]['date']);
            }
        }

        return labels;
    }

    function generateData() {
        var data = [];
        if (runs != '' && runs != null) {
            for (var i = 0; i < runs.length; i++) {
                data.push(runs[i]['Kilometers']);
            }
        }

        return data;
    }
	
	function initNotifications() {
		$.notify.defaults({
		  // whether to hide the notification on click
		  clickToHide: true,
		  // whether to auto-hide the notification
		  autoHide: true,
		  // if autoHide, hide after milliseconds
		  autoHideDelay: 3000,
		  // show the arrow pointing at the element
		  arrowShow: false,
		  // arrow size in pixels
		  //arrowSize: 5,
		  // position defines the notification position though uses the defaults below
		  //position: '...',
		  // default positions
		  //elementPosition: 'bottom left',
		  globalPosition: 'top right',
		  // default style
		  style: 'bootstrap',
		  // default class (string or [string])
		  className: 'success',
		  // show animation
		  showAnimation: 'fadeIn',
		  // show animation duration
		  showDuration: 300,
		  // hide animation
		  hideAnimation: 'fadeOut',
		  // hide animation duration
		  hideDuration: 200,
		  // padding between element and notification
		  gap: 2
		});
	}
	
	function initValidation() {
		$("#addForm").validate({
			rules: {
				addKilometers: {
					required: true,
					number: true
				},
				addDate: {
					required: true,
					runDate: true
				},
			},
			messages: {
				addKilometers: {
					required: "Please insert kilometers",
					number: "Kilometers must be a valid number"
				},
				addDate: {
					required: "Please provide a date",
					runDate: "Please enter a date in the format dd/mm/yyyy."
				}
			}, 
			showErrors: function(errorMap, errorList) {
				$(errorList).each(function(index, error) {
					$.notify(error.message, 'error');
				});
			}
		});
		
		$("#editForm").validate({
			rules: {
				editKilometers: {
					required: true,
					number: true
				},
				editDate: {
					required: true,
					runDate: true
				},
			},
			messages: {
				editKilometers: {
					required: "Please insert kilometers",
					number: "Kilometers must be a valid number"
				},
				editDate: {
					required: "Please provide a date",
					runDate: "Please enter a date in the format dd/mm/yyyy."
				}
			},
			showErrors: function(errorMap, errorList) {
				$(errorList).each(function(index, error) {
					$.notify(error.message, 'error');
				});
			}
		});
	}

	$.validator.addMethod(
		"runDate",
		function(value, element) {
			// put your own logic here, this is just a (crappy) example
			return value.match(/^\d\d?\/\d\d?\/\d\d\d\d$/);
		},
		"Please enter a date in the format dd/mm/yyyy."
	);
    /*
     *Get the runs object
     */
    function getRunsObject() {
        //Set runs array
        var runs = new Array();
        //Get current runs from localStorage
        var currentRuns = localStorage.getItem('runs');

        //Check localstorage
        if (currentRuns != null) {
            //Set to runs
            var runs = JSON.parse(currentRuns);
        }
        //Return runs object
        return runs.sort(function(a, b) { return new Date(b.date) - new Date(a.date) });
    }
});