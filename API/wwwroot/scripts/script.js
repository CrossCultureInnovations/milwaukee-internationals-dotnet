angular.element(document).ready(() => {
    window.setTimeout(() => {
        angular.element('.alert a').click();
    }, 5000);
});

angular.module('angular-async-await', [])
    .factory('$async', ['$rootScope', '$log', ($rootScope, $log) => async p => {
        try {
            return await p;
        } catch (e) {
            $log.error(e);
        } finally {
            $rootScope.$apply();
        }
    }]);

angular.module('tourApp', ['ui.toggle', 'ngTagsInput', 'chart.js', 'ngSanitize', 'angular-async-await'])
    .constant('jsPDF', (jspdf || window.jspdf).jsPDF)
    .directive('validateBeforeGoing', ['$window', $window => ({
        restrict: 'A',
        link: (scope, element, attrs) => {
            angular.element(element).on('click', (e) => {
                if (!$window.confirm(attrs.message)) {
                    e.preventDefault();
                }
            });
        }
    })])
    .controller('apiEventsCtrl', ['$scope', '$http', '$sce', '$async', async ($scope, $http, $sce, $async) => {

        $scope.count = 0;
        $scope.events = [];
        $scope.eventsRawDump = '';

        $scope.appendEvent = (evt) => {
            $scope.events.unshift(evt);
            $scope.eventsRawDump = $sce.trustAsHtml($scope.events.map(x => `${moment(x.recordedDate).local().format('YYYY-MM-DD HH:mm:ss')}\t${x.description}`).join('\n'));
            $scope.$apply();
        };

        $scope.init = async () => {
            const {data: events} = await $async($http.get('/apiEvents/latest'));
            const {data: {token}} = await $async($http.get('/identity/token'));

            events.sort((left, right) => moment.utc(left.recordedDate).diff(moment.utc(right.recordedDate))).forEach(evt => {
                $scope.appendEvent(evt);
            });

            const options = {
                transport: signalR.HttpTransportType.LongPolling,
                accessTokenFactory: () => token
            };

            const connection = new signalR.HubConnectionBuilder()
                .withUrl('/hub', options)
                .withAutomaticReconnect()
                .build();

            connection.on('count', count => {
                $scope.count = count;
                $scope.$apply();
            });

            connection.on('events', evt => {
                $scope.appendEvent(evt);
            });

            // Start the connection.
            await $async(connection.start());
        };

        await $async($scope.init());
    }])
    .controller('statsCtrl', ['$scope', '$http', '$async', async ($scope, $http, $async) => {
        $scope.countryDistribution = {};
        $scope.year = 'All';
        $scope.countryDistributionChartData = [];
        $scope.countryDistributionChartLabels = [];

        $scope.getCountryDistribution = async () => {
            const {data} = await $async($http.get('/stats/countryDistribution'));
            $scope.countryDistribution = data;
            $scope.refreshCountryDistributionChart();
        };

        $scope.handleYearChange = ($event) => {
            $event.preventDefault();
            $scope.year = $event.target.getAttribute('data-year');
            $scope.refreshCountryDistributionChart();
        };

        $scope.refreshCountryDistributionChart = () => {
            $scope.countryDistributionChartLabels = Object.keys($scope.countryDistribution[$scope.year]);
            $scope.countryDistributionChartData = Object.values($scope.countryDistribution[$scope.year]);
        };

        $scope.init = async () => {
            await $async($scope.getCountryDistribution());
        };

        await $async($scope.init());
    }])
    .controller('eventInfoCtrl', ['$scope', '$http', '$window', '$async', ($scope, $http, $window, $async) => {

        $scope.mapStudent = async $event => {
            $event.preventDefault();

            const eventId = $scope.eventId;
            const studentId = $scope.studentId;

            if (eventId && studentId) {
                await $async($http.post(`/api/event/map/${eventId}/${studentId}`));
                await $async($scope.fetchInfo());
            }
        };

        $scope.unMapStudent = async ($event, studentId) => {
            $event.preventDefault();

            const eventId = $scope.eventId;

            if (eventId && studentId) {
                await $async($http.post(`/api/event/unmap/${eventId}/${studentId}`));
                await $async($scope.fetchInfo());
            }
        };

        $scope.sendAdHocEmail = async $event => {
            $event.preventDefault();

            const eventId = $scope.eventId;
            const emailSubject = $scope.emailSubject;
            const emailBody = angular.element('.summernote').eq(0).summernote('code');

            if (eventId && emailSubject && emailBody && $window.confirm('Are you sure to send an email to RSVPed students?')) {
                await $async($http.post('/api/event/email', {
                    emails: $scope.event.students.map(x => x.student.email),
                    body: emailBody,
                    subject: emailSubject
                }));
                $window.alert('Successfully sent email!');
            }
        };

        $scope.fetchInfo = async () => {
            const {data} = await $async($http.get(`/api/event/info/${$scope.eventId}`));
            $scope.event = data.event;
            $scope.availableStudents = data.availableStudents;
        };

        // Start the text editor
        angular.element('.summernote').summernote({height: 150});

    }])
    .controller('userListCtrl', ['$scope', '$http', ($scope, $http) => {

    }])
    .controller('emailUtilityCtrl', ['$timeout', $timeout => {

        // Hide the .autoclose
        $timeout(() => {
            angular.element('.autoclose').fadeOut();
        }, 2000);

        // Start the text editor
        angular.element('.summernote').summernote({height: 150});
    }])
    .controller('emailCheckInCtrl', ['$scope', '$http', '$async', async ($scope, $http, $async) => {
        $scope.changeAttendance = async (type, id, value) => {
            await $async($http.post(`/utility/emailCheckInAction/${type}/${id}?present=${value}`));
        };
        console.log('Updated the attendance');
    }])
    .controller('hostEditCtrl', ['$scope', $scope => {

    }])
    .controller('hostRegistrationCtrl', ['$scope', $scope => {

    }])
    .controller('driverEditCtrl', ['$scope', $scope => {

    }])
    .controller('driverRegistrationCtrl', ['$scope', $scope => {

    }])
    .controller('studentRegistrationCtrl', ['$scope', $scope => {

    }])
    .controller('userRegistrationCtrl', ['$scope', $scope => {
        $scope.validateInvitationCode = $event => {
            if (!$scope.invitation_code || $scope.invitation_code.toLowerCase() !== $scope.invitation_code_value.toLowerCase()) {
                $scope.error = true;
                $event.preventDefault();
            } else {
                $scope.error = false;
            }
        }
    }])
    .controller('studentListCtrl', ['$scope', '$http', 'jsPDF', '$async', ($scope, $http, jsPDF, $async) => {

        $scope.pdfDownloadTable = {
            id: false,
            displayId: false,
            fullname: true,
            major: false,
            university: true,
            email: false,
            phone: true,
            country: true,
            isFamily: true,
            familySize: false,
            needCarSeat: true,
            kosherFood: true,
            isPresent: true,
            maskPreferred: false
        };

        $scope.showDetail = false;

        $scope.toggleShowDetail = () => {
        };

        $scope.getAllStudentsPDF = async () => {
            const {data: students} = await $async($http.get('/api/student'));

            const doc = new jsPDF({
                orientation: 'l',
                lineHeight: 1.5
            });

            doc.setFont('courier');

            const subsetAttr = (attrList, obj) => attrList.reduce((o, k) => {
                o[k] = String(obj[k]);
                return o;
            }, {});

            let i, j, temporary;
            const chunk = 25;
            const attributes = Object.keys($scope.pdfDownloadTable).filter(value => $scope.pdfDownloadTable[value]);

            let fontSize = 10;
            if (attributes.length <= 7) {
                fontSize = 10;
            } else if (attributes.length < 10) {
                fontSize = 8;
            } else {
                fontSize = 6;
            }

            doc.setFontSize(fontSize);

            for (i = 0, j = students.length; i < j; i += chunk) {
                temporary = students.slice(i, i + chunk);

                let str = stringTable.create(temporary.map(student => subsetAttr(attributes, student)));

                // Needed
                str = str.replace(/’/g, "'");

                doc.text(15, 15, str);

                if (i + chunk < j) {
                    doc.addPage();
                }
            }

            doc.save('student-list.pdf');
        };
    }])
    .controller('driverListCtrl', ['$scope', '$http', 'jsPDF', '$async', ($scope, $http, jsPDF, $async) => {
        $scope.getAllDriversPDF = async () => {
            const {data: drivers} = await $async($http.get('/api/driver'));

            const doc = new jsPDF({
                orientation: 'l',
                lineHeight: 1.5
            });

            doc.setFont('courier');

            doc.setFontSize(10);

            const subsetAttr = (attrList, obj) => attrList.reduce((o, k) => {
                o[k] = obj[k];
                return o;
            }, {});

            let i, j, temporary;
            const chunk = 25;
            for (i = 0, j = drivers.length; i < j; i += chunk) {
                temporary = drivers.slice(i, i + chunk);

                let str = stringTable.create(temporary.map(driver => {

                    // Set the navigator for the PDF
                    driver.navigator = (driver.navigator || driver.navigator === 'null') ?
                        (driver.navigator.length > 20 ? `${driver.navigator.substring(0, 20)} ...` : driver.navigator) : '-';

                    return subsetAttr(['displayId', 'fullname', 'capacity', 'navigator', 'role', 'haveChildSeat'], driver);
                }));

                // Needed
                str = str.replace(/’/g, "'");

                if (i === 0) {
                    str = `Driver List ( count of drivers: ${drivers.length} )\n\n${str}`;
                }

                doc.text(20, 20, str);

                if (i + chunk < j) {
                    doc.addPage();
                }
            }

            doc.save('driver-list.pdf');
        };
    }])
    .controller('hostListCtrl', ['$scope', '$http', 'jsPDF', '$async', ($scope, $http, jsPDF, $async) => {
        $scope.getAllHostPDF = async () => {
            const {data: hosts} = await $async($http.get('/api/host'));

            const doc = new jsPDF({
                orientation: 'l',
                lineHeight: 1.5
            });

            doc.setFont('courier');

            doc.setFontSize(10);

            const subsetAttr = (attrList, obj) => attrList.reduce((o, k) => {
                o[k] = obj[k];
                return o;
            }, {});

            let i, j, temporary;
            const chunk = 25;
            for (i = 0, j = hosts.length; i < j; i += chunk) {
                temporary = hosts.slice(i, i + chunk);

                let str = stringTable.create(temporary.map(host => subsetAttr(['fullname', 'email', 'phone', 'address'], host)));

                if (i === 0) {
                    str = `Host List ( count of hosts: ${hosts.length} )\n\n${str}`;
                }

                doc.text(20, 20, str);

                if (i + chunk < j) {
                    doc.addPage();
                }
            }

            doc.save('host-list.pdf');
        };
    }])
    .controller('studentDriverMappingCtrl', ['$scope', '$http', '$window', 'jsPDF', '$async', async ($scope, $http, $window, jsPDF, $async) => {

        $scope.showPresentOnly = false;

        $scope.resolvePassengers = driver => {
            if (driver.students && driver.students.length) {
                return driver.students.map(student => 1 + student.familySize).reduce((previousValue, currentValue) => previousValue + currentValue, 0);
            } else {
                return 0;
            }
        };

        $scope.togglePresentStudents = flag => {
            if (flag) {
                $scope.availableStudents = $scope.rawAvailableStudents.filter(student => student.isPresent);
            } else {
                $scope.availableStudents = $scope.rawAvailableStudents;
            }
        };

        $scope.getAllDriverMappingPDF = async () => {
            const {data: {mappedDrivers: driverBucket}} = await $async($http.get('/api/studentDriverMapping/status'));

            const doc = new jsPDF({
                orientation: 'l',
                lineHeight: 1.5
            });

            doc.setFont('courier');

            doc.setFontSize(11);

            const subsetAttr = (attrList, obj) => attrList.reduce((o, k) => {
                o[k] = obj[k];
                return o;
            }, {});

            driverBucket.map((driver, index) => {
                let str = '';

                if (driver) {
                    str += `Driver Name: ${driver.fullname}\n`;
                    str += `Driver Contact: ${driver.phone}\n`;
                    str += `Driver Capacity: ${driver.capacity}\n`;
                    str += '\n';
                }

                if (!driver.students) {
                    driver.students = [];
                }

                str += stringTable.create(driver.students.map(driver => subsetAttr(['fullname', 'email', 'phone', 'country', 'isPresent'], driver)));

                doc.text(20, 20, str);

                if (index + 1 < driverBucket.length) {
                    doc.addPage();
                }
            });

            doc.save('student-driver-mapping.pdf');
        };

        $scope.sendMailToDrivers = async $event => {
            if ($window.confirm('Are you sure to email mappings to drivers?')) {
                await $async($http.post('/api/studentDriverMapping/EmailMappings'));
                $window.alert('Successfully sent the mappings');
            }
        };

        $scope.getStatus = async () => {
            const {data} = await $async($http.get('/api/studentDriverMapping/status'));
            $scope.availableDrivers = data.availableDrivers;
            $scope.availableStudents = data.availableStudents;
            $scope.rawAvailableStudents = $scope.availableStudents;
            $scope.mappedDrivers = data.mappedDrivers;
            $scope.availableDriversTable = $scope.availableDrivers
                .reduce((acc, cur) => {
                    acc[cur.key.id] = cur.value;
                    return acc;
                }, {});

            $scope.availableDriversBuckets = data.availableDrivers
                .map(value => value.key)
                .reduce((rv, x) => {
                    const key = ('host' in x && !!x['host']) ? x['host'].fullname : 'Unassigned';
                    (rv[key] = rv[key] || []).push(x);
                    return rv;
                }, {});
        }

        $scope.map = async (studentId, driverId) => {
            await $async($scope.changeMap(studentId, driverId, 'map'));
        };

        $scope.unmap = async (studentId, driverId) => {
            await $async($scope.changeMap(studentId, driverId, 'unmap'));
        };

        $scope.changeMap = async (studentId, driverId, action) => {
            if (driverId && studentId) {
                await $async($http.post(`/api/studentDriverMapping/${action}`, {
                    driverId,
                    studentId
                }));
                await $async($scope.getStatus());
            }
        };

        $scope.init = async () => {
            await $async($scope.getStatus());
        };

        await $async($scope.init());
    }])
    .controller('studentAttendanceCtrl', ['$scope', '$http', '$window', '$async', async ($scope, $http, $window, $async) => {
        $scope.countries = ['All Countries'];
        $scope.students = [];
        $scope.allStudents = [];
        $scope.countryCount = {};

        $scope.country = 'All Countries';
        $scope.attendanceFilter = 'all';
        $scope.fullname = '';
        $scope.drivers = [];
        $scope.availableDriversBuckets = {};

        $scope.getCountAllStudents = () => $scope.allStudents.length;

        $scope.getCountPresentStudents = () => $scope.allStudents.filter(x => x.isPresent).length;

        $scope.getCountAbsentStudents = () => $scope.allStudents.filter(x => !x.isPresent).length;

        $scope.resolvePassengers = driver => {
            if (driver.students && driver.students.length) {
                return driver.students.map(student => 1 + student.familySize).reduce((previousValue, currentValue) => previousValue + currentValue, 0);
            } else {
                return 0;
            }
        };

        // Get All Drivers
        $scope.getAllDrivers = async () => {
            const {data} = await $async($http.get('/api/driver'));
            $scope.drivers = data.filter(driver => driver.role === 'Driver');

            $scope.availableDriversTable = $scope.drivers
                .reduce((acc, driver) => {
                    acc[driver.id] = driver.capacity > $scope.resolvePassengers(driver);
                    return acc;
                }, {});

            $scope.availableDriversBuckets = $scope.drivers.reduce((rv, x) => {
                const key = ('host' in x && !!x['host']) ? x['host'].fullname : 'Unassigned';
                (rv[key] = rv[key] || []).push(x);
                return rv;
            }, {});
        };

        $scope.addDriverMap = async (studentId, driverId) => {
            if (driverId && studentId) {
                await $async($http.post('/api/studentDriverMapping/map', {
                    driverId,
                    studentId
                }));
                await $async($scope.getAllDrivers());
                await $async($scope.getAllStudents());
            }
        };

        $scope.checkInViaEmail = async () => {
            if ($window.confirm('Are you sure to send check-in via email to students?')) {
                await $async($http.post('/api/attendance/student/sendCheckIn'));
                alert('Check-in via email is sent to students');
            }
        };

        $scope.getCountryCount = country => {
            if (country in $scope.countryCount) {
                return $scope.countryCount[country];
            } else {
                return 0;
            }
        };

        $scope.getAllStudents = async () => {
            const response = await $async($http.get('/api/student'));

            $scope.students = response.data;
            $scope.allStudents = response.data;

            $scope.students.forEach(student => {
                if (!$scope.countries.includes(student.country)) {
                    $scope.countries.push(student.country);
                }

                if (student.country in $scope.countryCount) {
                    $scope.countryCount[student.country] = 1 + $scope.countryCount[student.country];
                } else {
                    $scope.countryCount[student.country] = 1;
                }
            });

            $scope.countryCount['All Countries'] = $scope.allStudents.length;

            // Filter
            const countries = $scope.countries.filter(value => value !== 'All Countries');

            // Sort
            countries.sort();

            $scope.countries = ['All Countries'].concat(countries);

            $scope.updateTable();
        };

        $scope.changeAttendance = async student => {
            await $async($http.post('/api/attendance/student/setAttendance', {
                id: student.id,
                attendance: student.isPresent
            }));

            await $async($scope.getAllStudents());
        }

        $scope.updateTable = () => {
            let students = $scope.allStudents;

            const filteredStudents = {
                'country': [],
                'attendance': [],
                'fullname': []
            };

            if ($scope.country === 'All Countries') {
                filteredStudents.country = students;
            } else {
                students.forEach(student => {
                    if (student.country === $scope.country) {
                        filteredStudents.country.push(student);
                    }
                });
            }

            students = filteredStudents.country;

            if ($scope.attendanceFilter === 'all') {
                filteredStudents.attendance = students;
            } else {
                students.forEach(student => {
                    if ((student.isPresent && $scope.attendanceFilter === 'yes') || (!student.isPresent && $scope.attendanceFilter === 'no')) {
                        filteredStudents.attendance.push(student);
                    }
                });
            }

            students = filteredStudents.attendance;

            if (!$scope.fullname) {
                filteredStudents.fullname = students;
            } else {
                students.forEach(student => {
                    if (student.fullname.toLowerCase().indexOf($scope.fullname.toLowerCase()) > -1) {
                        filteredStudents.fullname.push(student);
                    }
                });
            }

            students = filteredStudents.fullname;

            $scope.students = students;
        };

        $scope.init = async () => {
            await $async($scope.getAllDrivers());
            await $async($scope.getAllStudents());
        };

        await $async($scope.init());
    }])
    .controller('driverHostMappingCtrl', ['$scope', '$http', '$window', 'jsPDF', '$async', async ($scope, $http, $window, jsPDF, $async) => {

        $scope.resolvePassengers = driver => {
            if (driver.students && driver.students.length) {
                return driver.students.map(student => 1 + student.familySize).reduce((previousValue, currentValue) => previousValue + currentValue, 0);
            } else {
                return 0;
            }
        };

        $scope.getHostInfo = host => {
            let hostCapacity = 0;
            let hostAssigned = 0;

            if (host.drivers) {
                hostCapacity = host.drivers.map(driver => driver.capacity)
                    .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

                hostAssigned = host.drivers.map(driver => $scope.resolvePassengers(driver)).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
            }

            return {
                hostCapacity,
                hostAssigned
            };
        };

        $scope.getAllDriverMappingPDF = async () => {
            const response = await $async($http.get('/api/driverHostMapping/status'));
            const hostBucket = response.data.mappedHosts;

            const doc = new jsPDF({
                orientation: 'l',
                lineHeight: 1.5
            });

            doc.setFont('courier');

            doc.setFontSize(11);

            const subsetAttr = (attrList, obj) => attrList.reduce((o, k) => {
                o[k] = obj[k];
                return o;
            }, {});

            hostBucket.map((host, index) => {
                let str = '';

                if (host) {
                    str += `Host Name: ${host.fullname}\n`;
                    str += `Host Address: ${host.address}\n`;
                    str += `Host Contact: ${host.phone}\n`;
                    str += '\n';
                }

                str += stringTable.create(host.drivers.map(driver => subsetAttr(['fullname', 'email', 'phone', 'capacity', 'isPresent'], driver)));

                doc.text(20, 20, str);

                if (index + 1 < hostBucket.length) {
                    doc.addPage();
                }
            });

            doc.save('driver-host-mapping.pdf');
        };

        $scope.sendMailToHosts = async $event => {
            if ($window.confirm('Are you sure to email mappings to hosts?')) {
                await $async($http.post('/api/driverHostMapping/EmailMappings'));
                $window.alert('Successfully sent the mappings');
            }
        };

        $scope.getStatus = async () => {
            const {data} = await $async($http.get('/api/driverHostMapping/status'));
            $scope.availableDrivers = data.availableDrivers;
            $scope.availableHosts = data.availableHosts;
            $scope.mappedHosts = data.mappedHosts;
        };

        $scope.map = async (driverId, hostId) => {
            await $async($scope.changeMap(driverId, hostId, 'map'));
        };

        $scope.unmap = async (driverId, hostId) => {
            await $async($scope.changeMap(driverId, hostId, 'unmap'));
        };

        $scope.changeMap = async (driverId, hostId, action) => {
            if (driverId && hostId) {
                await $async($http.post(`/api/driverHostMapping/${action}`, {
                    driverId,
                    hostId
                }));
                await $async($scope.getStatus());
            }
        };

        $scope.init = async () => {
            await $async($scope.getStatus());
        };

        await $async($scope.init());
    }])
    .controller('driverAttendanceCtrl', ['$scope', '$http', '$window', '$async', async ($scope, $http, $window, $async) => {
        $scope.drivers = [];
        $scope.allDrivers = [];

        $scope.attendanceFilter = 'all';
        $scope.fullname = '';

        $scope.getCountAllDrivers = () => $scope.allDrivers.length;

        $scope.getCountPresentDrivers = () => $scope.allDrivers.filter(x => x.isPresent).length;

        $scope.getCountAbsentDrivers = () => $scope.allDrivers.filter(x => !x.isPresent).length;

        $scope.checkInViaEmail = async () => {
            if ($window.confirm('Are you sure to send check-in via email to drivers?')) {
                await $async($http.post('/api/attendance/driver/sendCheckIn'));
                alert('Check-in via email is sent to drivers');
            }
        };

        $scope.getAllDrivers = async () => {
            const {data} = await $async($http.get('/api/driver'));
            $scope.drivers = data.filter(value => value.role === 'Driver');
            $scope.allDrivers = data.filter(value => value.role === 'Driver');

            $scope.updateTable();
        }

        $scope.changeAttendance = async driver => {
            await $async($http.post('/api/attendance/driver/setAttendance', {
                id: driver.id,
                attendance: driver.isPresent
            }));
            await $async($scope.getAllDrivers());
        }

        $scope.updateTable = () => {
            let drivers = $scope.allDrivers;

            const filteredDrivers = {
                'attendance': [],
                'fullname': []
            };

            if ($scope.attendanceFilter === 'all') {
                filteredDrivers.attendance = drivers;
            } else {
                drivers.forEach(driver => {
                    if ((driver.isPresent && $scope.attendanceFilter === 'yes') || (!driver.isPresent && $scope.attendanceFilter === 'no')) {
                        filteredDrivers.attendance.push(driver);
                    }
                });
            }

            drivers = filteredDrivers.attendance;

            if (!$scope.fullname) {
                filteredDrivers.fullname = drivers;
            } else {
                drivers.forEach(driver => {
                    if (driver.fullname.toLowerCase().indexOf($scope.fullname.toLowerCase()) > -1) {
                        filteredDrivers.fullname.push(driver);
                    }
                });
            }

            drivers = filteredDrivers.fullname;

            $scope.drivers = drivers;
        };

        $scope.init = async () => {
            await $async($scope.getAllDrivers());
        };

        await $async($scope.init());
    }]);
    
