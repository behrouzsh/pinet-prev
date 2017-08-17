/**
 * Created by chojnasm on 11/9/15.
 * Modified by Behrouz on 9/2/16.
 */
var appModule = angular.module('plnModule', ['angular.filter', 'angularUtils.directives.dirPagination']);


appModule.directive('combineHorizontalScrolls', [function(){
    var scrollTop = 0;
    function combine(elements){
        elements.on('scroll', function(e){
            if(e.isTrigger){
                debugger;
                e.target.scrollTop = scrollTop;
            }else {
                scrollTop = e.target.scrollTop;
                elements.each(function (element) {
                    if( !this.isSameNode(e.target) ){
                        $(this).trigger('scroll');
                    }
                });
            }
        });
    }

    return {
        restrict: 'A',
        replace: false,
        compile: function(element, attrs){
            combine(element.find('.'+attrs.combineHorizontalScrolls));
        }
    };
}]);

appModule.controller("MainCtrl", ['$http', '$scope', '$window', function ($http, $scope, $window) {

    var self = this;

    self.formatAsInchOrAllhits = false;
    self.formatInput = false;
    self.formatAsJsonOrInline = false;
    self.allVsFirstPrositeHits = false;
    self.prositeFound = '';
    self.prositeFoundNum = 0;
    self.uniprotFound = '';
    self.uniprotFoundNum = 0;
    self.uniprotLength = 0;
    self.motifLength = 0;
    self.textAreaFormatMD = "IYQY[+80]IQSR[+42]\nK[+112.1]SAPATGGVK[+42]K[+56]PHR";
    self.textAreaFormatSN = "IYQ[pY]IQS[aR]\n[aK]SAPATGGVK[mK]PHR";
    self.organism = "9606"; //9606:Homo Sapiens, 10116:Rattus Norvegicus, 10090: Mus Musculus
    //self.genes = [BRAF,CDK1];


    // if (!self.formatInput) {
    //     self.textArea = self.textAreaFormatMD;
    // } else {
    //     self.textArea = self.textAreaFormatSN;
    // }



    var newModificationString;

    self.waiting = false;
    self.showOutput = false;
    self.noResponse = false;
    self.showGeneNetworkProcessed = false;
    self.showKinaseNetworkProcessed = false;
    self.showPhosphoGeneNetworkProcessed = false;
    self.showGeneNetwork = true;
    self.showPhosphoGeneNetwork = true;
    self.modificationPattern = /[^A-Z]/g;
    self.modificationPatternWithLetter = /[A-Z]\[\+[\d\.]+]/g;
    self.modificationPatternSecondFormat = /\[[a-z]+[A-Z]+\]/g;
    self.rowSplitPattern = /[,;\n]/;
    self.rowSplitPatternGenes = /[,;\n]/;
    self.cleanFormattedModifications = /\[/;
    self.patt1=/[A-Z]/g;
    self.patt2=/[a-z]/g;
    self.patt3=/\d+/g
    self.patt4=/[+\d\.]+/g;
    self.modificationForGenes = /\b\w*[^\[]\w*\b/g;
    self.modificationForPTMGenes = /\b\w*[\[]\w*\b/g;

    self.modificationMap = {'a':42.03, 'm':14.02, 'p':79.97};
    self.modificationMapReverse = {41:'a', 42:'a',43:'a',13:'m',14:'m',15:'m', 79:'p', 80:'p', 81:'p'};
    self.proteinMap = {};
    self.hugoProteinMap = {};
    var protPlace = 0;
    var emptyList = [];
    self.prResponseList = [];
    self.prResponseJson = {};

    var distinct = [];
    var firstPrositeResponseFiltered = [];
    self.parsedMotifs = [];
    self.parsedPeptides = [];
    self.genes = [];
    //self.genes = ["BRAF","CDK1"];
    self.parsedGenes = [];
    self.parsedModifications = [];
    self.parsedModificationsFormatter = [];
    self.ontologyMappings = [];
    self.ontologyMappingsUnique = [];
    self.numResponsesFromProsite = 0;
    self.numResponsesFromUniprot;
    self.plnFormatOne = [];
    self.plnFormatTwo = [];
    self.plnFirstHit = [];
    self.sequence_acList = [];
    self.geneIdList = [];
    self.sequence_acListComplete = [];


    $scope.sort = function(keyname){
        $scope.sortKey = keyname;   //set the sortKey to the param passed
        $scope.reverse = !$scope.reverse; //if true make it false and vice versa
    };
    <!--This is for label selection between human, mouse and rat-->
    console.log("self.organism in start:");
    console.log(self.organism);
    $("input:checkbox").on('click', function() {
        // in the handler, 'this' refers to the box clicked on
        var $box = $(this);
        if ($box.is(":checked")) {
            // the name of the box is retrieved using the .attr() method
            // as it is assumed and expected to be immutable
            var group = "input:checkbox[name='" + $box.attr("name") + "']";
            console.log($box.attr("value"));
            self.organism = $box.attr("value");
            console.log("self.organism");
            console.log(self.organism);
            // the checked state of the group/box on the other hand will change
            // and the current value is retrieved using .prop() method
            $(group).prop("checked", false);
            $box.prop("checked", true);
        } else {
            $box.prop("checked", false);
        }
    });
    // $scope.newPage = function (){
    //     location.href = '#/new-page.html';
    // };

    //function($scope, $window) {
    $scope.customNavigateApi = function(msg){
        $window.open("/pln/api/pathway/genes/" + msg, '_blank');
    };

    $scope.customNavigateGraphics = function(msg){
        $window.localStorage.setItem("genes", msg);
        $window.open("/pln/pinet.html", '_blank');
        self.inputGenesForPathway = $window.localStorage.getItem("genes");
        var inputGenesForPathway = $window.localStorage.getItem("genes");
        console.log("inputGenes");
        console.log(self.inputGenesForPathway);
        console.log(inputGenesForPathway);
    };

    self.changePLN = function(similarmod, originalmod,similardescription, originaldescription){

        console.log(similarmod);
        console.log(originalmod);
        console.log(similardescription);
        console.log(originaldescription);
        // console.log(self.ontologyMappings);
        console.log(self.plnFormatOne);
        console.log(self.plnFormatTwo);
        self.ontologyMappings.map(function (e) {
            // console.log(e);
            if (e.identifier === originalmod) {
                e.identifier = similarmod;
                e.description = similardescription;

                    e.similar.map(function (e2) {
                        // console.log(e2);
                        if (e2.string === similarmod) {
                            e2.string = originalmod;
                            e2.description = originaldescription;

                        }
                    })
                // }
            }



        })
        var radios = document.getElementsByTagName('inputRadioPLN');
        for(i=0; i<radios.length; i++ ) {
            radios[i].onclick = function(e3) {
                if(e3.ctrlKey) {
                    this.checked = false;
                }
            }
        }
        self.plnFormatOne.map(function (e4) {
            console.log(e4);
            e4.PTM.map(function (e5) {
                e5.map(function (e6) {
                    console.log(e6);
                    if (e6.identifier === originalmod) {
                        console.log(e6.identifier);
                        console.log(similarmod);
                        e6.identifier = similarmod;
                    }
                })
            })
        })
        self.plnFormatOne.map(function (e7) {
            e7.PTM.map(function (e8) {
                e8.map(function (e9) {
                    console.log(e9);
                    if (e9.identifier === originalmod) {

                        console.log(originalmod);
                        e9.identifier = similarmod;
                    }
                })
            })
        })


        console.log(self.plnFormatOne);
        console.log(self.plnFormatTwo);
    };

    $scope.retrieveGenes = function() {
        self.genes = localStorage.getItem("genes");
        localStorage.setItem("genes", "");
        console.log(self.genes);
        //alert(self.genes);

    };


    $scope.$watch(function () {
        return self.formatInput
    }, function (newValue, oldValue) {
        if (!self.formatInput) {
            self.textArea = self.textAreaFormatMD;
        } else {
            self.textArea = self.textAreaFormatSN;
        }
    });

    // track changes in user input
    $scope.$watch(function () {
        return self.textArea
    }, function (newValue, oldValue) {


        // parse motifs
        self.parsedMotifs = self.textArea
            .split(self.rowSplitPattern)
            .map(function (e) {
                return e.replace(self.modificationPattern, '')
            });

        // parse peptides
        self.parsedPeptides = self.textArea
            .split(self.rowSplitPattern);

        // parse modifications
        self.parsedModifications = self.textArea
            .split(self.rowSplitPattern)
            .map(function (e) {
                if(!self.formatInput) {
                    return e.match(self.modificationPatternWithLetter);
                }else
                {
                    return e.match(self.modificationPatternSecondFormat);
                }
            });
        //console.log(self.parsedModifications);
        // format parsed modifiacations
        self.parsedModificationsForOntology = self.parsedModifications;

        self.parsedModificationsFormatter = [];
        self.parsedModificationsFormatter = self.parsedModifications
            .map(function (e) {
                if (e != null)
                    return e.join(" ");
            });


        self.plnFirstHit = [];


    });

    // track changes in user input


    // track changes in parsed modifications and refresh psi-mod mapping
    $scope.$watch(function () {
        return self.parsedModifications
    }, function (nV, oV) {
        self.ontologyMappings = [];
        self.ontologyMappingsUnique = [];
        distinct = [];
        firstPrositeResponseFiltered = [];
        self.plnFormatOne = [];
        self.plnFormatTwo = [];
        self.plnFirstHit = [];
        var elMass;
        var elShorthand;


        self.parsedModifications.forEach(function (e) {
            if (e != null) {
                e.forEach(function (el) {
                    (function (el) {
                        if(self.formatInput) {
                            elMass = el.match(self.patt1)+"[+"+self.modificationMap[el.match(self.patt2)]+"]";
                            //el3 = el;
                        }else {
                            elMass = el;
                        }
                        (function (elMass) {
                        $http.get("api/psimod/" + elMass)
                            .success(function (data) {
                                // console.log("here");
                                // console.log(elMass.match(self.patt3));
                                // console.log(self.modificationMapReverse[elMass.match(self.patt3)]);
                                if (self.modificationMapReverse[elMass.match(self.patt3)]) {

                                    elShorthand = "[" + self.modificationMapReverse[elMass.match(self.patt3)] + elMass.match(self.patt1) + "]";
                                }
                                else{
                                    elShorthand = ""
                                }
                                var result = {};
                                result.identifier = data.string;
                                result.modification = elMass;
                                result.shorthand = elShorthand;
                                result.diffavg = data.aDouble;


                                result.description = data.description;
                                if (data.description == null){
                                    result.description = "Not found in Psi-Mod ontology data base!";
                                }
                                result.similar = data.similar;
                                if (self.ontologyMappingsUnique.indexOf(el) === -1) {
                                    self.ontologyMappingsUnique.push(el);
                                    self.ontologyMappings.push(result);
                                }
                                //self.ontologyMappings.push(result);
                                //console.log("result");
                                //console.log(result);
                            })
                            .error(function (data, status) {
                                // console.log(data);
                                // console.log(status);
                                var result = {};
                                result.identifier = "";

                                result.modification = elMass;
                                if (self.modificationMapReverse[elMass.match(self.patt3)]) {
                                    elShorthand = "[" + self.modificationMapReverse[elMass.match(self.patt3)] + elMass.match(self.patt1) + "]";
                                }
                                else{
                                    elShorthand = ""
                                }
                                result.shorthand = elShorthand;
                                result.diffavg = "";
                                result.description = "Error!";
                                result.similar = "";
                                //self.ontologyMappings.push(result);
                                if (self.ontologyMappingsUnique.indexOf(el) === -1) {
                                    self.ontologyMappingsUnique.push(el);
                                    self.ontologyMappings.push(result);
                                }

                            });
                        }(elMass));
                    }(el));
                })
            }
        });
    })


    self.onSubmit = function () {

        console.log("test logging");
        self.showInstruction = false;
        self.waiting = true;
        self.showOutput = false;
        self.sequence_acList = [];
        self.geneIdList = [];
        self.sequence_acListComplete = [];
        self.numResponsesFromProsite = 0;
        self.numResponsesFromUniprot = 0;
        self.responseRaw = [];
        self.responseRawLocal = [];
        self.prResponseList = [];
        self.prResponseJson = {};
        self.uniprotResponseRaw = [];
        self.uniprotResponseRawJson = [];
        var prositeHttpResponse = [];
        self.motifLength = self.parsedMotifs.length;
        self.uniprotFound = " ";
        self.uniprotFoundNum = 0;
        self.prositeFound = " ";
        self.prositeFoundNum = 0;
        //Capturing response from the prosite api
        var url = 'api/prosite/';

        var prositeResponseIterator = 0;
        self.uniprotResponseIteratorTotal = 0;
        self.uniprotResponseIterator = 0;
        for (var j = 0; j < self.parsedMotifs.length; j++) {

            var localMotif = self.parsedMotifs[j];
            var localPeptide = self.parsedPeptides[j];
            //console.log(localMotif);
            //console.log(localPeptide);

            (function (localMotif, localPeptide) {
                    $http.get(url + localMotif + "," + self.organism)
                    .success(function (data) {
                        self.responseRawLocal = [];
                        console.log("prosite success!");
                        console.log(localMotif);
                        // console.log(data);


                        var matchset = data.matchset;
                        //console.log(matchset);
                        var nMatch = data.n_match;
                        self.uniprotResponseIteratorTotal += nMatch;
                        if (nMatch >= 0) {
                            self.prositeFoundNum = self.prositeFoundNum + 1;
                            self.prositeFound = localPeptide;
                            self.showOutput = true;
                        }
                        // if (nMatch == 0) {
                        //     self.prositeFoundNum = self.prositeFoundNum + 1;
                        //     self.prositeFound = localPeptide;
                        //     self.showOutput = true;
                        // }
                        data.matchset.map(function (e) {
                            e.motif = localMotif;
                            e.peptide = localPeptide;
                            return e;
                        });
                        self.numResponsesFromProsite++;
                        var flagFound = 1;
                        if (nMatch === 0) {
                            flagFound = 0;

                            self.responseRawLocal = self.responseRawLocal.concat([
                            {
                                "motif": localMotif,
                                "peptide":localPeptide,
                                "sequence_ac": " ",
                                "sequence_id": " ",
                                "sequence_db": "Not found in canonical protein data base!",
                                "start": " ",
                                "stop": " ",
                                "signature_ac": " "
                            }]);
                        }
                        else {
                            self.responseRawLocal = self.responseRawLocal.concat(matchset);
                        }

                        self.responseRaw = self.responseRaw.concat(self.responseRawLocal);

                        self.prResponseJson = {"motif":localMotif,"peptide":localPeptide,"length": self.responseRawLocal.length, "response":self.responseRawLocal}
                        self.prResponseList = self.prResponseList.concat(self.prResponseJson);
                        //for ()
                        //self.prResponseList
                        // console.log("Response Local");
                        // console.log(self.responseRawLocal);
                        //
                        // console.log("Response Raw");
                        // console.log(self.responseRaw);
                        //
                        // console.log("total response");
                        // console.log(self.prResponseJson);



                        //Uniprot query

                        var url2 = 'api/uniprot/';
                        prositeResponseIterator = 0;
                        if (flagFound === 0) {
                            // console.log("--------------");
                            // console.log("uniprotResponseIterator");
                            // console.log(self.uniprotResponseIterator);
                            // console.log("uniprotResponseIteratorTotal");
                            // console.log(self.uniprotResponseIteratorTotal);
                            //
                            // console.log("numResponsesFromProsite");
                            // console.log(self.numResponsesFromProsite);
                            // console.log("parsedMotifs.length");
                            // console.log(self.parsedMotifs.length);



                            // console.log(self.uniprotResponseIterator);
                            // console.log(self.responseRawLocal.length);
                            // console.log(self.numResponsesFromProsite);
                            // console.log(self.parsedMotifs.length);

                            if (self.numResponsesFromProsite >= self.parsedMotifs.length && self.uniprotResponseIterator >= self.uniprotResponseIteratorTotal) {

                                self.showOutput = true;
                                console.log("Before updating pln! number of numResponsesFromProsite");
                                console.log(self.numResponsesFromProsite);
                                console.log("--------------");
                                console.log("uniprotResponseIterator");
                                console.log(self.uniprotResponseIterator);
                                console.log("uniprotResponseIteratorTotal");
                                console.log(self.uniprotResponseIteratorTotal);

                                console.log("numResponsesFromProsite");
                                console.log(self.numResponsesFromProsite);
                                console.log("parsedMotifs.length");
                                console.log(self.parsedMotifs.length);
                                self.updatePln(self.parsedMotifs, self.textArea, self.responseRaw, self.proteinMap);
                            }
                        }
                        if (flagFound === 1) {

                            while (prositeResponseIterator < self.responseRawLocal.length) {


                                var uniportQuery = self.responseRawLocal[prositeResponseIterator].sequence_ac;


                                var startMotif = self.responseRawLocal[prositeResponseIterator].start;
                                var stopMotif = self.responseRawLocal[prositeResponseIterator].stop;
                                var motifMotif = self.responseRawLocal[prositeResponseIterator].motif;
                                var motifPeptide = self.responseRawLocal[prositeResponseIterator].peptide;



                                if (self.sequence_acList.indexOf(uniportQuery) === -1) {
                                    self.sequence_acList.push(uniportQuery);
                                    //console.log("sequence_acList: " + self.sequence_acList);
                                    var sequence_acListMember = {
                                        "id": self.sequence_acList.length,
                                        "name": uniportQuery,
                                        "length": 1,
                                        "members": emptyList
                                    };
                                    self.sequence_acListComplete = self.sequence_acListComplete.concat(sequence_acListMember);
                                    protPlace = self.sequence_acList.length - 1;
                                    self.uniprotLength = self.sequence_acList.length;
                                    // console.log("sequence_acListComplete");
                                    // console.log(self.sequence_acListComplete);
                                }
                                else {
                                    for (var prot = 0; prot < self.sequence_acListComplete.length; prot++) {
                                        if (uniportQuery === self.sequence_acListComplete[prot].name) {
                                            protPlace = prot;
                                            //console.log("Adding a member to" + uniportQuery);
                                            self.sequence_acListComplete[prot].length = self.sequence_acListComplete[prot].length + 1;
                                            prot = self.sequence_acListComplete.length;
                                        }
                                    }
                                }

                                // console.log(startMotif);
                                // console.log(stopMotif);
                                (function (uniportQuery, startMotif, stopMotif, motifMotif, motifPeptide, protPlace) {

                                    $http.get(url2 + uniportQuery + "," + self.organism)
                                        .success(function (data) {


                                            self.uniprotFound = uniportQuery;
                                            if (self.uniprotFoundNum < self.uniprotLength) {
                                                self.uniprotFoundNum = self.uniprotFoundNum + 1;
                                            };
                                            self.showOutput = true;

                                            var uniprotJsonObject = data;

                                            //console.log("Uniprot Response");
                                            //console.log(uniprotJsonObject);
                                            //Defining protein to gene map
                                            var key = self.uniprotFound;
                                            var value = uniprotJsonObject.gene_id;
                                            //console.log("key");
                                            //console.log(key);
                                            //console.log("value");
                                            //console.log(value);
                                            self.proteinMap[key] = value;


                                            //console.log("proteinMap");
                                            //console.log(self.proteinMap);


                                            var geneId = uniprotJsonObject.gene_id;
                                            for (var geneIdIter = 0; geneIdIter < geneId.length; geneIdIter++){
                                                if (self.geneIdList.indexOf(geneId[geneIdIter]) === -1) {
                                                    self.geneIdList.push(geneId[geneIdIter]);
                                                    // console.log("geneIdList");
                                                    // console.log(self.geneIdList);
                                                }

                                            }



                                            //var uniprotJsonObject = data;
                                            // console.log(JSON.stringify(data));
                                            // var start = self.responseRaw[prositeResponseIterator].startMotif;
                                            // var stop = self.responseRaw[prositeResponseIterator].stopMotif;
                                            // console.log(start);
                                            // console.log(stop);

                                            // console.log(self.responseRaw[prositeResponseIterator].stop);
                                            uniprotJsonObject["start"] = startMotif;
                                            uniprotJsonObject["stop"] = stopMotif;
                                            uniprotJsonObject["motif"] = motifMotif;
                                            uniprotJsonObject["peptide"] = motifPeptide;
                                            uniprotJsonObject["sequence_ac"] = uniportQuery;
                                            // console.log(uniprotJsonObject);

                                            // data.matchset.map(function (e) {
                                            //     e.motif = localMotif;
                                            //     return e;
                                            // });
                                            //+++++++++++++++++++++++++++++++++++++++++++++++++++
                                            //var matchset = data.matchset;
                                            //self.uniprotResponseRaw = self.uniprotResponseRaw.concat(uniprotJsonObject.toString());

                                            self.sequence_acListComplete[protPlace].members = self.sequence_acListComplete[protPlace].members.concat(uniprotJsonObject);

                                            // console.log("protPlace: " + protPlace);
                                            // console.log("sequence_acListComplete.name: " + self.sequence_acListComplete[protPlace].name);
                                            // console.log("sequence_acListComplete2.length: " + self.sequence_acListComplete[protPlace].length);
                                            // console.log("sequence_acListComplete3.members: " + self.sequence_acListComplete[protPlace].members);
                                            // for(var foo = 0; foo < self.sequence_acListComplete[protPlace].members.length; foo++)
                                            // {
                                            //     console.log("foo   "+ foo);
                                            //     console.log(self.sequence_acListComplete[protPlace].members[foo].sequence_ac);
                                            //     console.log(self.sequence_acListComplete[protPlace].members[foo].motif);
                                            //
                                            // }

                                            self.uniprotResponseRaw = self.uniprotResponseRaw.concat(uniprotJsonObject);
                                            //self.uniprotResponseRaw = self.uniprotResponseRaw.concat(JSON.stringify(data));

                                            //console.log("ResponseRaw: " + self.responseRaw);
                                            self.uniprotResponseIterator++;
                                            console.log("--------------");
                                            console.log("uniprotResponseIterator");
                                            console.log(self.uniprotResponseIterator);
                                            console.log("uniprotResponseIteratorTotal");
                                            console.log(self.uniprotResponseIteratorTotal);

                                            console.log("numResponsesFromProsite");
                                            console.log(self.numResponsesFromProsite);
                                            console.log("parsedMotifs.length");
                                            console.log(self.parsedMotifs.length);



                                            // console.log(self.uniprotResponseIterator);
                                            // console.log(self.responseRawLocal.length);
                                            // console.log(self.numResponsesFromProsite);
                                            // console.log(self.parsedMotifs.length);

                                            if (self.numResponsesFromProsite >= self.parsedMotifs.length && self.uniprotResponseIterator >= self.uniprotResponseIteratorTotal) {

                                                self.showOutput = true;
                                                console.log("Before updating pln! number of numResponsesFromProsite");
                                                console.log(self.numResponsesFromProsite);
                                                console.log("--------------");
                                                console.log("uniprotResponseIterator");
                                                console.log(self.uniprotResponseIterator);
                                                console.log("uniprotResponseIteratorTotal");
                                                console.log(self.uniprotResponseIteratorTotal);

                                                console.log("numResponsesFromProsite");
                                                console.log(self.numResponsesFromProsite);
                                                console.log("parsedMotifs.length");
                                                console.log(self.parsedMotifs.length);
                                                self.updatePln(self.parsedMotifs, self.textArea, self.responseRaw, self.proteinMap);
                                            }
                                            //prositeResponseIterator++;
                                        })
                                        .error(function (data, status) {
                                            //self.noResponse = true;
                                            // console.log(data);
                                            // console.log(status);
                                            self.uniprotResponseIterator++;
                                            // console.log(self.uniprotResponseIterator);
                                            // console.log(self.responseRawLocal.length);
                                            //
                                            //
                                            // console.log(self.uniprotResponseIterator);
                                            // console.log(self.responseRawLocal.length);
                                            // console.log(self.numResponsesFromProsite);
                                            // console.log(self.parsedMotifs.length);

                                            if (self.numResponsesFromProsite >= self.parsedMotifs.length && self.uniprotResponseIterator >= self.responseRawLocal.length) {
                                                //console.log(self.uniprotResponseIterator);
                                                //console.log(self.responseRawLocal.length);
                                                // self.waiting = false;
                                                // self.showOutput = true;
                                                // console.log("before updating pln");
                                                // console.log("Num of responses from prosite");
                                                // console.log(self.numResponsesFromProsite);
                                                self.showOutput = true;
                                                console.log("Before updating pln! number of numResponsesFromProsite");
                                                console.log(self.numResponsesFromProsite);
                                                self.updatePln(self.parsedMotifs, self.textArea, self.responseRaw, self.proteinMap);
                                            }
                                            //prositeResponseIterator++;
                                        });


                                })(uniportQuery, startMotif, stopMotif, motifMotif, motifPeptide, protPlace);


                                prositeResponseIterator++;




                            }



                        }

                        // console.log("prositeResponseIterator");
                        // console.log(prositeResponseIterator);

                    //++++++++++++++++++++++++++++++++++++++
                    })
                    .error(function (data, status) {
                        self.noResponse = true;
                        self.prositeFoundNum = self.prositeFoundNum + 1;
                        self.prositeFound = localMotif;
                        self.showOutput = true;
                        console.log("prosite error");
                        console.log(localMotif);
                        console.log(data);
                        console.log(status);
                        self.responseRawLocal = [];
                        //self.prResponseList = [];
                        self.responseRaw = [];
                        self.responseRawLocal = self.responseRawLocal.concat({
                            "motif": localMotif,
                            "peptide": localPeptide,
                            "sequence_ac": " ",
                            "sequence_id": " ",
                            "sequence_db": " Prosite Response Error! ",
                            "start": " ",
                            "stop": " ",
                            "signature_ac": " "
                        });

                        self.responseRaw = self.responseRaw.concat(self.responseRawLocal);

                        self.prResponseJson = {"motif":localMotif, "peptide":localPeptide,"length": self.responseRawLocal.length, "response":self.responseRaw};
                        self.prResponseList = self.prResponseList.concat(self.prResponseJson);
                        //for ()
                        //self.prResponseList
                        // console.log("Response Local");
                        // console.log(self.responseRawLocal);
                        //
                        // console.log("Response Raw");
                        // console.log(self.responseRaw);
                        //
                        // console.log("total response");
                        // console.log(self.prResponseJson);


                        self.numResponsesFromProsite++;
                        console.log("--------------");
                        console.log("uniprotResponseIterator");
                        console.log(self.uniprotResponseIterator);
                        console.log("uniprotResponseIteratorTotal");
                        console.log(self.uniprotResponseIteratorTotal);

                        console.log("numResponsesFromProsite");
                        console.log(self.numResponsesFromProsite);
                        console.log("parsedMotifs.length");
                        console.log(self.parsedMotifs.length);
                        if (self.numResponsesFromProsite >= self.parsedMotifs.length && self.uniprotResponseIterator >= self.responseRawLocal.length) {
                            // console.log("before updating pln");
                            // console.log("Num of responses from prosite");
                            // console.log(self.numResponsesFromProsite);
                            self.showOutput = true;
                            console.log("Before updating pln in the error section! ");
                            console.log("Before updating pln! number of numResponsesFromProsite");
                            console.log(self.numResponsesFromProsite);
                            self.updatePln(self.parsedMotifs, self.textArea, self.responseRaw, self.proteinMap);
                        }




                    })

                })(localMotif, localPeptide);
        }

    }


    self.updatePln = function (parsedMotifsInput, textAreaInput, responseRawInput, proteinMapInput) {
        self.plnFormatOne = [];
        self.plnFormatTwo = [];
        self.ptmGenes = [];
        self.phosphoGenes = [];
        //peptideFlag is used to see which peptides are found
        self.peptideFlag = [];
        self.peptideFlag.push(["peptide","flag"]);

        var motifs = parsedMotifsInput;
        var proteinMap = proteinMapInput;
        self.peptideToModificationList = [];
        var peptides = textAreaInput
            .split(self.rowSplitPattern);
        console.log("********************************");
        console.log("In update pln");
        console.log("motifs " + motifs);
        console.log("peptides " + peptides);
        console.log("responseRawInput ");
        console.log(responseRawInput);
        console.log("proteinMap ");
        console.log(proteinMap);

        for (var i = 0; i < peptides.length; i++) {
            var motif = motifs[i];
            var peptide = peptides[i];
            //console.log("in loop motif " + motif);
            var firstPrositeResponse = responseRawInput
                .filter(function (e) {

                    return e.motif == motif;

                });

            distinct = [];
            firstPrositeResponseFiltered = [];

            for (var fpr = 0; fpr < firstPrositeResponse.length; fpr++) {
                if (distinct.indexOf(firstPrositeResponse[fpr].sequence_ac) === -1) {
                    distinct.push(firstPrositeResponse[fpr].sequence_ac);
                    firstPrositeResponseFiltered.push(firstPrositeResponse[fpr]);
                }
            }

            //firstPrositeResponse = firstPrositeResponse[0];
            var uniprotArray = [];
            var hugoArray = [];
            var ptmArray = [];

            console.log("motif: ");
            console.log(motif);
            console.log("firstPrositeResponse: ");
            console.log(firstPrositeResponse);
            console.log("firstPrositeResponseFiltered: ");
            console.log(firstPrositeResponseFiltered);
            if (firstPrositeResponseFiltered.length != 0) {
                if (firstPrositeResponseFiltered[0].sequence_db == "Not found in canonical protein data base!") {
                    self.peptideFlag.push([peptide, 0])
                }
                else if (firstPrositeResponseFiltered[0].sequence_db == " Prosite Response Error! ") {
                    self.peptideFlag.push([peptide, -1])
                }
                else {
                    self.peptideFlag.push([peptide, 1])
                }
            }
            else
                {
                    self.peptideFlag.push([peptide, -2])
                }





            firstPrositeResponseFiltered.map(function(e){
                uniprotArray.push(e.sequence_ac);
                var sequence_acMapped = e.sequence_ac;
                var hugoString = '';
                //console.log("proteinMap[sequence_acMapped]");
                if (sequence_acMapped in proteinMap) {
                    for (var proteinMapGeneIter = 0; proteinMapGeneIter < proteinMap[e.sequence_ac].length - 1; proteinMapGeneIter++){
                        hugoString = hugoString + String(proteinMap[e.sequence_ac][proteinMapGeneIter]) + '&';
                        //hugoArray.push(proteinMap[e.sequence_ac][proteinMapGeneIter]);
                    };
                    var lenProteinMap = proteinMap[e.sequence_ac].length;

                    hugoString = hugoString + String(proteinMap[e.sequence_ac][lenProteinMap - 1]);
                    hugoArray.push(hugoString);
                }
                ptmArray.push(e.start);
            });

            var uniprot = uniprotArray;
            var hugo = hugoArray;


            var ptm = [];

            ptmArray.map(function(start, ptmArrayIndex){

                var ptmLocal = [];

                // for a given peptide iterate through modifications, calculate its offset and return to ptmLocal
                self.ontologyMappings
                    .filter(function (el) {
                        //console.log(peptide.indexOf(el.modification));
                        return (peptide.indexOf(el.modification) > -1);
                    })
                    .map(function (e) {
                        var offset = peptide.indexOf(e.modification);
                        var beforeOffset = peptide.substring(0,offset);
                        var decreaseOffset = beforeOffset.length - beforeOffset.replace(self.modificationPattern, '').length;
                        //console.log(e.shorthand.match(self.patt2));
                        if (self.patt2.test(e.shorthand)){
                            var ptmShorthandModification = e.shorthand.match(self.patt2);
                            var ptmShorthandSite = e.shorthand.match(self.patt1);
                        }
                        else {
                            var ptmShorthandModification = '';
                            var ptmShorthandSite = '';
                        };
                        var ptmMassModification = e.modification.match(self.patt4);
                        var ptmMassSite = e.modification.match(self.patt1);
                        ptmLocal.push({"identifier": e.identifier, "ptmMassSite":ptmMassSite,"ptmMassModification":ptmMassModification,"ptmShorthandSite":ptmShorthandSite,"ptmShorthandModification":ptmShorthandModification,"shorthand": e.shorthand, "location": offset - decreaseOffset + start});


                    });

                ptm.push(ptmLocal);
            });

            //console.log("ptm");
            //console.log(ptm);
            //var pr_ac = [];
            var geneResponse = {};
            var geneResponseArray = [];
            var geneArray = [];
            var ptmGenesMassArray = [];
            var ptmGenesShorthandArray = [];

            for(var pepToModIter = 0; pepToModIter < firstPrositeResponseFiltered.length ; pepToModIter++) {

                // var geneResponse = {};
                // var geneResponseArray = [];
                geneArray = [];
                ptmGenesMassArray = [];
                ptmGenesShorthandArray = [];


                var prRes = firstPrositeResponseFiltered[pepToModIter];
                var ptmRes = ptm[pepToModIter];
                //pr_ac.push(prRes.sequence_ac);
                console.log(prRes);
                //console.log(ptmRes);
                console.log(prRes.sequence_ac);
                console.log(proteinMap[prRes.sequence_ac]);
                //console.log(proteinMap[prRes.sequence_ac]);
                if (prRes.sequence_ac != " ") {

                    proteinMap[prRes.sequence_ac].map(function (e2) {
                        geneArray.push(e2);
                    });
                    for (var geneIter = 0; geneIter < proteinMap[prRes.sequence_ac].length; geneIter++) {
                        var genePr = proteinMap[prRes.sequence_ac][geneIter];
                        for (var ptmIter = 0; ptmIter < ptmRes.length; ptmIter++) {
                            var ptmItem = ptmRes[ptmIter];
                            var ptmGeneMass = genePr.toString() + '[' + ptmItem.ptmMassSite + ptmItem.ptmMassModification + '@' + ptmItem.location + ']';
                            ptmGenesMassArray.push(ptmGeneMass);


                            if (ptmItem.ptmShorthandModification != '') {
                                var ptmGeneShorthand = genePr.toString() + '[' + ptmItem.ptmShorthandModification + ptmItem.ptmShorthandSite + '@' + ptmItem.location + ']';
                                ptmGenesShorthandArray.push(ptmGeneShorthand);
                                // if (self.geneIdList.indexOf(geneId[geneIdIter]) === -1) {
                                //     self.geneIdList.push(geneId[geneIdIter]);
                                //     // console.log("geneIdList");
                                //     // console.log(self.geneIdList);
                                // }

                                if (ptmItem.ptmShorthandModification[0] === "p" &&  self.geneIdList.indexOf(ptmGeneShorthand) === -1) {
                                    //console.log("here");
                                    self.geneIdList.push(ptmGeneShorthand);
                                    //console.log(self.geneIdList);

                                }
                            }
                        }
                    }
                }
                //console.log(ptmGenesMassArray);
                //console.log(ptmGenesShorthandArray);
                geneResponse = {"sequence_ac":prRes.sequence_ac, "geneArray":geneArray,"ptmGenesMass":ptmGenesMassArray,"ptmGenesShorthand":ptmGenesShorthandArray};
                geneResponseArray.push(geneResponse);
            }

            self.geneResponseJson = {"motif":peptide, "length": firstPrositeResponseFiltered.length, "response":geneResponseArray};
            self.peptideToModificationList = self.peptideToModificationList.concat(self.geneResponseJson);
            //console.log(self.peptideToModificationList);



            self.plnFormatOne.push({
                "PLN": {"ver1": "InChl-like"},
                "REF": {"uniprot": uniprot},
                "SYM": {"hugo": hugo},
                "DES": {},
                "VAR": {},
                "PTM": ptm
            });

            self.plnFormatTwo.push({
                "PLN": {"ver1": "all_hits"},
                "REF": {"uniprot": uniprot},
                "SYM": {"hugo": hugo},
                "DES": {},
                "VAR": {},
                "PTM": ptm
            });
            //This function is used to save the peptideFalg data


        }
        function exportToCsv(filename, rows) {
            var processRow = function (row) {
                var finalVal = '';
                for (var j = 0; j < row.length; j++) {
                    var innerValue = row[j] === null ? '' : row[j].toString();
                    if (row[j] instanceof Date) {
                        innerValue = row[j].toLocaleString();
                    };
                    var result = innerValue.replace(/"/g, '""');
                    if (result.search(/("|,|\n)/g) >= 0)
                        result = '"' + result + '"';
                    if (j > 0)
                        finalVal += ',';
                    finalVal += result;
                }
                return finalVal + '\n';
            };

            var csvFile = '';
            for (var i = 0; i < rows.length; i++) {
                csvFile += processRow(rows[i]);
            }

            var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
            if (navigator.msSaveBlob) { // IE 10+
                navigator.msSaveBlob(blob, filename);
            } else {
                var link = document.createElement("a");
                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    var url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", filename);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        }


        //exportToCsv("peptideFlag.csv", self.peptideFlag);

        console.log("self.peptideFlag");
        console.log(self.peptideFlag);
        //console.log(self.prResponseList);
        self.waiting = false;
    }

    // var timeoutPromise;
    // var delayInMs = 2000;
    //Pathway Analysis Text +++++++++++++++++++++++++++++++++++++++

    self.genePlaces = [];
    self.inputGeneInfo = [];

    Array.prototype.clean = function(deleteValue) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == deleteValue) {
                this.splice(i, 1);
                i--;
            }
        }
        return this;
    };


    self.changeToP100 = function () {
        self.genes = "OCIAD1,NCOR2,ZC3HC1,RPS6KA3,PDPK1,PDPK2P,HN1,MAP4,ABI1,UHRF1BP1L,WDR20,RBM17,DYRK1A,DYRK1B,FAM129B,TMSB4X,IQGAP3,CLTA,SYNRG,SRRM1,MAP3K7,LARP4B,ZC3H14,PFKP,KIF4A,KIAA0930,DHX16,HAT1,ULK1,JUND,BRAF,JUN,FOSL2,BRD4,RPL12,NUP214,FASN,PRRC2A,FAM76B,RPS6KA1,RPS6,RPS6KA6,ZNF672,PAK2,AHNAK,TMPO,NCBP3,CASC3,EIF4A3,NUFIP2,GPALPP1,ATAD2,RBBP6,ZNF740,CCNYL1,NFATC2IP,RNF169,DDX54,ATXN2L,SMARCC1,KHSRP,SH3KBP1,ATRIP,CHAMP1,TPX2,DPF2,RBM14,ALS2,PPP1R10,RSF1,WAC,NANS,WDR26,LRWD1,TERF2IP,BAP1,UBE2O,LIMA1,NOC2L,SRRT,ANLN,THRAP3,GPATCH8,VPRBP,MAP3K2,PRRC2C,MARK2,CDK1,PLEC,SLC38A1,NOLC1,SRRM2,DYRK1A[pY@321],DYRK1B[pY@273],RPS6KA3[pS@369],HN1[pS@87],ZC3HC1[pS@321],NCOR2[pS@956],UHRF1BP1L[pS@935],OCIAD1[pS@108],PDPK1[pS@241],PDPK2P[pS@214],ABI1[pS@183],WDR20[pS@434],MAP4[pS@1073],RBM17[pS@222],IQGAP3[pS@1424],FAM129B[pS@691],CLTA[pS@105],SYNRG[pS@1075],ZC3H14[pS@515],PFKP[pS@386],LARP4B[pS@601],HAT1[pS@361],MAP3K7[pS@439],SRRM1[pS@402],BRD4[pS@1117],ULK1[pS@556],KIF4A[pS@801],KIAA0930[pS@362],DHX16[pS@103],BRAF[pS@446],FOSL2[pS@200],JUND[pS@100],JUN[pS@73],RPL12[pS@38],NUP214[pS@1023],EIF4A3[pS@12],TMPO[pS@306],PRRC2A[pS@1219],FASN[pS@207],FAM76B[pS@193],RPS6[pS@235],AHNAK[pS@3426],RPS6KA1[pS@221],RPS6KA3[pS@227],RPS6KA6[pS@232],ZNF672[pS@189],NCBP3[pS@500],ATAD2[pS@327],NUFIP2[pS@652],RBBP6[pS@1179],CASC3[pS@265],GPALPP1[pS@105],CCNYL1[pS@344],NFATC2IP[pS@204],RNF169[pS@403],ZNF740[pS@44],DDX54[pS@75],ATXN2L[pS@339],ATRIP[pS@224],DPF2[pS@142],SMARCC1[pS@310],KHSRP[pS@480],SH3KBP1[pS@230],CHAMP1[pS@405],RBM14[pS@618],ALS2[pS@483],PPP1R10[pS@313],TPX2[pS@738],RSF1[pS@473],WAC[pS@64],BAP1[pS@460],UBE2O[pS@515],WDR26[pS@121],ANLN[pS@295],NANS[pS@275],TERF2IP[pS@203],LRWD1[pS@212],LIMA1[pS@362],LIMA1[pS@490],GPATCH8[pS@1035],SRRT[pT@544],MAP3K2[pS@163],THRAP3[pS@253],NOC2L[pS@56],VPRBP[pS@1000],PRRC2C[pT@2673],MARK2[pT@596],SLC38A1[pS@52],PRRC2C[pS@1544],CDK1[pT@161],TMPO[pT@160],NOLC1[pT@610],PLEC[pT@4030],SRRM2[pT@1492]";
    }
    self.changeToP100Peptides = function () {
        self.textArea = "IYQY[+80]IQSR\nTPKDS[+80]PGIPPSANAHQLFR\nRNS[+80]SEASSGDFLDLK\nLPLVPES[+80]PRR\nANAS[+80]PQKPLDLK\n\
SMS[+80]VDLSHIPLKDPLLFK\nLENS[+80]PLGEALR\n\
ANS[+80]FVGTAQYVSPELLTEK\nTNPPTQKPPS[+80]PPMSGR\nSNS[+80]LPHSAVSNAGSK\nVGS[+80]LDNVGHLPAGGAVK\nS[+80]PTGPSNSFLANMGGTVAHK\n\
S[+80]LTAHSLLPLAEK\nAAPEAS[+80]SPPASPLQHLLPGK\nS[+122]DKPDMAEIEKFDK\nS[+122]DKPDM[+16]AEIEKFDK\n\
LQS[+80]EPESIR\nSLS[+80]LGDKEISR\nDLVQPDKPAS[+80]PK\nS[+80]FAGNLNTYKR\nSPS[+80]PAHLPDDPKVAEK\n\
RLIS[+80]PYKK\nS[+80]IQDLTVTGTEPGQVSSR\nHRPS[+80]PPATPPPK\nIHS[+80]PIIR\nLHS[+80]APNLSDLHVVRPK\n\
TFS[+80]LTEVR\nSLVGS[+80]WLK\nLLEDS[+80]EESSEETVSR\nTLGRRDS[+80]SDDWEIPDGQITVGQR\nS[+80]PPAPGLQPMR\n\
S[+80]PPAPGLQPM[+16]R\nLAS[+80]PELER\nIGPLGLS[+80]PK\nTPS[+80]IQPSLLPHAAPFAK\nA[+42]TTATMATSGS[+80]AR\n\
A[+42]TTATM[+16]ATSGS[+80]AR\nHAS[+80]PILPITEFSDIPR\nLIPGPLS[+80]PVAR\nLGMLS[+80]PEGTC[+57]K\nLGM[+16]LS[+80]PEGTC[+57]K\n\
ISNLS[+80]PEEEQGLWK\nRRLS[+80]SLR\nVSMPDVELNLKS[+80]PK\nS[+122]DNGELEDKPPAPPVR\nKAYS[+80]FC[+57]GTVEYMAPEVVNR\n\
KAYS[+80]FC[+57]GTVEYM[+16]APEVVNR\nIHVSRS[+80]PTRPR\nRPHS[+80]PEKAFSSNPVVR\nKPNIFYSGPAS[+80]PARPR\n\
NDS[+80]WGSFDLR\nLEVTEIVKPS[+80]PK\nYGS[+80]PPQRDPNWNGER\nQDDS[+80]PPRPIIGPALPPGFIK\n\
SFS[+80]ADNFIGIQR\nTEFLDLDNSPLSPPS[+80]PR\nVLS[+80]PLIIK\nAGS[+80]PDVLR\nLGPGRPLPTFPTSEC[+57]TS[+80]DVEPDTR\n\
QGSGRES[+80]PSLASR\nLAAPSVSHVS[+80]PR\n\
VDDDS[+80]LGEFPVTNSR\n\
NEEPVRS[+80]PERR\n\
LFIIRGS[+80]PQQIDHAK\n\
S[+80]IEVENDFLPVEK\n\
TAPTLS[+80]PEHWK\n\
RLS[+80]ESQLSFRR\n\
RLS[+80]LPGLLSQVSPR\n\
VLS[+80]PTAAKPSPFEGK\n\
SSDQPLTVPVS[+80]PK\n\
FYETKEESYS[+80]PSKDR\n\
SDS[+80]PENKYSDSTGHSK\n\
S[+80]IPLSIK\n\
RLS[+80]QSDEDVIR\n\
ATS[+80]PVKSTTSITDAK\n\
ALGS[+80]PTKQLLPC[+57]EMAC[+57]NEK\n\
YLLGDAPVS[+80]PSSQK\n\
ANS[+80]PEKPPEAGAAHKPR\n\
SEVQQPVHPKPLS[+80]PDSR\n\
ETPHS[+80]PGVEDAPIAK\n\
SQS[+80]PHYFR\n\
TQLWASEPGT[+80]PPLPTSLPSQNPILK\n\
DRS[+80]SPPPGYIPDELHQVAR\n\
SPALKS[+80]PLQSVVVR\n\
SPDKPGGS[+80]PSASRR\n\
HLPS[+80]PPTLDSIITEYLR\n\
AFGSGIDIKPGT[+80]PPIAGR\n\
ST[+80]FHAGQLR\n\
S[+80]LTNSHLEKK\n\
SFS[+80]SQRPVDR\n\
VYT[+80]HEVVTLWYR\n\
SST[+80]PLPTISSSAENTR\n\
LQTPNT[+80]FPKR\n\
QIT[+80]MEELVR\n\
QIT[+80]M[+16]EELVR\n\
ALPQT[+80]PRPR";
    }

    $scope.$watch(function () {
        return self.genes
    }, function (newValue, oldValue) {

        self.showGeneNetworkProcessed = false;
        self.showKinaseNetworkProcessed = false;
        self.showPhosphoGeneNetworkProcessed = false;


        self.showGeneNetwork = true;
        self.showPhosphoGeneNetwork = true;
        if (self.genes.length > 0) {
            self.parsedGenes = self.genes
                .split(self.rowSplitPatternGenes)
                .map(function (e) {
                    if (e.indexOf('[') == -1) {
                        return e
                    }
                });
            self.parsedGenes.clean(undefined);
        }
        if(self.parsedGenes.length == 0){
            self.showGeneNetwork = false;
            console.log("self.showGeneNetwork = false;");
        }
        // .filter(function (el) {
        //         return (el !== null);
        //     });
        // .filter(function (el) {
        //     //console.log(peptide.indexOf(el.modification));
        //     return (peptide.indexOf(el.modification) > -1);
        // })
        if (self.genes.length > 0) {
            self.parsedPhosphoGenes = self.genes
                .split(self.rowSplitPatternGenes)
                .map(function (e) {
                    if (e.indexOf('[') > -1) {
                        return e
                    }
                    //return e.toUpperCase().match(self.modificationForPTMGenes);;
                });
            self.parsedPhosphoGenes.clean(undefined);
        }
        if(self.parsedPhosphoGenes.length == 0){
            self.showPhosphoGeneNetwork = false;
            console.log("self.showPhosphoGeneNetwork = false;");
        }
        // .filter(function (el) {
        //         return (el !== null);
        //     });
        console.log(self.parsedGenes);
        console.log(self.parsedPhosphoGenes);
        console.log(self.showPhosphoGeneNetwork);
        console.log(self.showGeneNetwork);

    });

    // self.parsedModifications = self.textArea
    //     .split(self.rowSplitPattern)
    //     .map(function (e) {
    //         if(!self.formatInput) {
    //             return e.match(self.modificationPatternWithLetter);
    //         }else
    //         {
    //             return e.match(self.modificationPatternSecondFormat);
    //         }
    //     });


    $scope.$watch(function () {
        return self.parsedGenes
    }, function (nV, oV) {
        //self.showOutputPathway = false;
        self.flagFoundNPCG = false;
        self.waitingPathway = true;
        self.showOutputPathway = false;
        self.genePlaces = [];
        self.inputGeneInfo = [];
        self.nonValidGenes = [];
        self.network = {};
        self.kinaseNetwork = {};
        self.numberOfAllInputGenes = 0;
        self.numberOfAllValidGenes = 0;
        console.log("self.parsedGenes.length");
        console.log(self.parsedGenes.length);
        // This is for slicing the input genes because it makes problems if we have long list of genes in the http.get
        var genePartitioned = function splitarray(input, spacing)
        {
            var output = [];

            for (var i = 0; i < input.length; i += spacing)
            {
                output[output.length] = input.slice(i, i + spacing);
            }

            return output;
        }(self.parsedGenes, self.parsedGenes.length)

        console.log(genePartitioned);
        console.log(genePartitioned.length);
        // var flag = true;
        // while (flag){
        //     var queryGeneList = [];
        //     self.parsedGenes
        //
        // }
        if (genePartitioned.length > 0) {
            for (i = 0; i < genePartitioned.length; i++) {
                $http.get("api/pcg/checkgenes/" + genePartitioned[i])
                    .success(function (genePositions) {
                        console.log("genePositions");
                        console.log(genePositions);
                        self.genePlaces = genePositions;
                        for (var geneIter = 0; geneIter < self.genePlaces.length; geneIter++) {
                            self.numberOfAllInputGenes = self.numberOfAllInputGenes + 1;
                            if (self.genePlaces[geneIter] != -1) {
                                self.numberOfAllValidGenes = self.numberOfAllValidGenes + 1;
                            }
                            else {
                                self.flagFoundNPCG = true;
                                self.nonValidGenes.push(self.parsedGenes[geneIter]);
                                console.log("self.nonValidGenes");
                                console.log(self.nonValidGenes);
                            }
                        }
                        // self.genePlaces.forEach(function (e) {
                        //     self.numberOfAllInputGenes = self.numberOfAllInputGenes + 1;
                        //     if (e != -1) {
                        //         self.numberOfAllValidGenes = self.numberOfAllValidGenes + 1;
                        //     }
                        //     else
                        //     {
                        //         self.nonValidGenes.push(self.parsedGenes[])
                        //     }
                        //     ;
                        // });

                        $http.get("api/pcg/geneinfo/" + self.genePlaces)
                            .success(function (geneInfos) {
                                console.log(geneInfos);
                                for (var geneInfoIter = 0; geneInfoIter < geneInfos.length; geneInfoIter++) {
                                    self.inputGeneInfo.push(geneInfos[geneInfoIter]);
                                }
                                console.log(self.inputGeneInfo);
                            })
                            .error(function () {
                                console.log("Error in obtaining gene info from api/pcg/geneinfo/");
                            });
                    })
                    .error(function () {
                        console.log("Error in obtaining gene place from api/pcg/checkgenes/");
                    });
            }
        }



    });





    var svg = d3.selectAll("#chart").append("svg");
    var svg2 = d3.selectAll("#chart2").append("svg");
    var svg3 = d3.selectAll("#chart3").append("svg");
    self.onSubmitPathway = function () {

        var force;

        var xScale = d3.scale.linear().range([5, 10]);
        var colNodeScaleSeparate = d3.scale.ordinal()
            .range(["#767776", "#f91104", "#0af702"])
            .domain([0,1,2]);
        var colNodeScale = d3.scale.linear().range(["grey", "red"]);
        var colScale = d3.scale.linear().range(["grey", "red"]);
        var edgeWeightScale = d3.scale.linear().range([1, 3]);
        d3.selectAll("svg > *").remove();
        // d3.select("#chart").remove();
        // d3.select("#chart2").remove();
        // d3.select("#chart3").remove();
        //d3.select("svg").remove();
        // svg.remove();
        // svg2.remove();
        // svg3.remove();
        //d3.select("svg").remove();
        //++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        //++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        //++++++++++++++++++++++++++++++++++++++++++++++++++++++++






        function update(nodes, links) {
            //
            //var svg;
            svg.remove();

            var margin = 100,
                w = 1500 -2*margin,
                h = w,
                radius = w / 2,
                strokeWidth = 4,
                hyp2 = Math.pow(radius, 2),
                nodeBaseRad = 5;

            svg = d3.select("#chart")
                .append("svg")
                .attr("style", "outline: thin solid blue;")
                .attr("width", w)
                .attr("height", h);

            // var pool = svg.append('circle')
            //     .style('stroke-width', strokeWidth * 2)
            //     .style('stroke-width', strokeWidth * 2)
            //     .attr({
            //         class: 'pool',
            //         r: radius,
            //         index: -1,
            //         cy: 0,
            //         cx: 0,
            //         transform: 'translate(' + w / 2 + ',' + h / 2 + ')'
            //     });

            var force = d3.layout.force()
                .nodes(nodes)
                .links(links)
                .size([w, h])
                .gravity(.25)
                .linkDistance(100)
                .charge(-500)
                //.gravity(0.05)
                .on("tick", tick)
                .start();
                //.stop();


            xScale.domain(d3.extent(nodes, function (d) { return d.weight; }));
            colNodeScale.domain(d3.extent(nodes, function (d) { return d.group; }));
            colScale.domain(d3.extent(links, function (d) { return d.weight; }));


            var path = svg.append("svg:g").selectAll("path")
                //.data(links)
                .data(force.links())
                .enter().append("svg:path")
                .style("stroke", function (d) {return colScale(d.value); })
                .attr("class", function(d) { return "link "; });





            //************************************
            // var text = svg.append("svg:g").selectAll("g")
            //     .data(force.nodes())
            //     .enter().append("svg:g");
            // text.append("svg:text")
            //     .attr("x", 12)
            //     .attr("y", ".31em")
            //     .text(function(d) {
            //        return d.full_name; });
            //************************************

                    //return d.full_name; });
                 //.on("mouseover",function(d){
                 //     return d.full_name;
                 // });
                // .transition()
                // .duration(300)
                // .text(
                //      function(){ console.log("mouseOver"); d3.select(this).select("text").style("fill", "#000");} )
                // .on("mouseout", function(){ console.log("mouseOut"); d3.select(this).select("text").style("fill", "#ccc");} ); ;




            var node = svg.append("svg:g").selectAll("g.node")
                .data(force.nodes())
                .enter().append("svg:g")
                .attr("class", "node")
                .call(force.drag);

            node.append("circle")
                .attr("r", function (d) { return xScale(d.weight); })
                .style("fill", function(d) { return colNodeScale(d.group); });
                //.on("dblclick", dblclick);


            function openLink() {
                return function(d) {
                    var url = "";
                    if(d.slug != "") {
                        url = d.slug
                    } //else if(d.type == 2) {
                    //url = "clients/" + d.slug
                    //} else if(d.type == 3) {
                    //url = "agencies/" + d.slug
                    //}
                    window.open("//"+url)
                }
            };
            node.append("svg:image")
                .attr("class", function(d){ return d.name })
                //.attr("xlink:href", function(d){ return d.img_hrefD})
                .attr("x", "-36px")
                .attr("y", "-36px")
                .attr("width", "70px")
                .attr("height", "70px")
                .on("dblclick", openLink());
                // .on("mouseover", function (d) { if(d.entity == "company")
                // {
                //     d3.select(this).attr("width", "90px")
                //         .attr("x", "-46px")
                //         .attr("y", "-36.5px")
                //         .attr("xlink:href", function(d){ return d.img_hrefL});
                // }
                // })
                // .on("mouseout", function (d) { if(d.entity == "company")
                // {
                //     d3.select(this).attr("width", "70px")
                //         .attr("x", "-36px")
                //         .attr("y", "-36px")
                //         .attr("xlink:href", function(d){ return d.img_hrefD});
                // }
                // });


                //.text(function(d) { return d.name })
            node.append("svg:text")
                .attr("class", function(d){ return d.name })
                .attr("x", 12)
                .attr("y", ".31em")
                //.attr("class", "shadow")
                //.style("font-size","10px")
                // .attr("dx", 0)
                // .attr("dy", ".35em")
                //.style("font-size","12px")
                .style("font", "12px sans-serif")
                //.attr("text-anchor", "middle")
                //.style("fill", "black")
                .text(function(d) { return d.name });

            node.on("mouseover", function(d) {
                d3.select(this).select("text")
                    .transition()
                    .duration(300)
                    .text(function (d) {
                        return d.full_name;
                    })
                //.style("font-size", "15px")
                .style("font", "15px sans-serif");


                    //d3.selectAll("text").remove();
                    //d3.select(this).style("stroke-width", 6);

                //d3.select(this).select("text").style("stroke", "blue");

                    var nodeNeighbors = links.filter(function(link) {
                        // Filter the list of links to only those links that have our target
                        // node as a source or target
                        return link.source.index === d.index || link.target.index === d.index;})
                        .map(function(link) {
                            // Map the list of links to a simple array of the neighboring indices - this is
                            // technically not required but makes the code below simpler because we can use
                            // indexOf instead of iterating and searching ourselves.
                            return link.source.index === d.index ? link.target.index : link.source.index; });

                    d3.selectAll('circle').filter(function(node) {
                        // I filter the selection of all circles to only those that hold a node with an
                        // index in my listg of neighbors
                        return nodeNeighbors.indexOf(node.index) > -1;
                    })
                        .style('stroke', 'blue');

                    //d3.selectAll('text').filter(d).style('fill', 'blue');
                    //****************************
                    // d3.selectAll('text').filter(function(node) {
                    //     // I filter the selection of all circles to only those that hold a node with an
                    //     // index in my listg of neighbors
                    //     return nodeNeighbors.indexOf(node.index) > -1;
                    // }).style('fill', 'blue')
                    //     //.style("font-size", "16px")
                    //     //.style("font-weight", "bold");
                    // //****************************
                    path.style('stroke', function(l) {
                        if (d === l.source || d === l.target)
                            return "blue";
                        else
                        return "grey";
                    })

                    path.style('stroke-width', function(l) {
                        if (d === l.source || d === l.target)
                            return 3;
                        else
                            return 1;
                    })

                })
                .on("mouseout",  function(d) {
                    d3.select(this).select("text")
                        .transition()
                        .duration(300)
                        .text(function (d) {
                            return d.name;
                        });
                    d3.select(this).select("text")
                        .style("font", "12px sans-serif")
                        .style("font-size", "12px")
                        .style("fill",'black')
                        .style("font-weight", "normal");
                    //d3.select(this).style("stroke", "black");
                    //d3.select(this).style("stroke-width", 1);
                    //d3.select(this).style("stroke", "#333");
                    path.style('stroke', "grey");
                    path.style('stroke-width', 1);
                    //circle.style('stroke', "grey");
                    //node.style("stroke-width", 3);
                    //node.style("stroke", "#333");
                    //d3.selectAll('text').style('fill', 'black')
                    d3.selectAll('text').style('fill', 'black')
                        .style("font-weight", "normal");
                    //d3.selectAll("text").style("font-weight", "normal");
                    node.selectAll("circle").style("stroke-width", 3)
                        .style('stroke', "black");
                    //.style("font-size", "12px");
                    //}
                });


            function pythag(r, b, coord) {
                r += nodeBaseRad;

                // force use of b coord that exists in circle to avoid sqrt(x<0)
                b = Math.min(w - r - strokeWidth, Math.max(r + strokeWidth, b));

                var b2 = Math.pow((b - radius), 2),
                    a = Math.sqrt(hyp2 - b2);

                function openLink() {
                    return function(d) {
                        var url = "";
                        if(d.slug != "") {
                            url = d.slug
                        } //else if(d.type == 2) {
                        //url = "clients/" + d.slug
                        //} else if(d.type == 3) {
                        //url = "agencies/" + d.slug
                        //}
                        window.open("//"+url)
                    }
                }
                // radius - sqrt(hyp^2 - b^2) < coord < sqrt(hyp^2 - b^2) + radius
                coord = Math.max(radius - a + r + strokeWidth,
                    Math.min(a + radius - r - strokeWidth, coord));

                return coord;
            }

            function tick(e) {
                path.attr("d", function(d) {
                    var dx = d.target.x - d.source.x,
                        dy = d.target.y - d.source.y,

                        dr = Math.sqrt(dx * dx + dy * dy);
                    //console.log(d.source.x);
                    // console.log(d.target.x);
                    return "M" + d.source.x + "," + d.source.y + ","+ d.target.x + "," + d.target.y;
                    //return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                });

                node.attr('x', function (d) { return d.x = pythag(Math.random() * 12, d.y, d.x); })
                    .attr('y', function (d) { return d.y = pythag(Math.random() * 12, d.x, d.y); })
                    .attr("transform", function(d) {
                        return "translate(" + d.x + "," + d.y + ")"});

                // circle.attr("transform", function(d) {
                //     return "translate(" + d.x + "," + d.y + ")";
                // });
                //************************************
                // text.attr("transform", function(d) {
                //     return "translate(" + d.x + "," + d.y + ")";
                // });
                //************************************
            }
            //For not moving after drag
            var drag = force.drag()
                .on("dragstart", dragstart);

            //For not moving after drag
            function dblclick(d) {
                d3.select(this).classed("fixed", d.fixed = false);
            }
            //For not moving after drag
            function dragstart(d) {
                d3.select(this).classed("fixed", d.fixed = true);
            }


            // For legend
            var colNodeScaleSeparateInfo = d3.scale.ordinal()
                .range(["#767776", "#f91104"])
                .domain(["Query Gene Set","Pathways / Kinases Perturbation"]);


            var legend = svg.selectAll(".legend")
                .data(colNodeScaleSeparateInfo.domain())
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return "translate(0," + (i) * 25 + ")"; });

            legend.append("rect")
                .attr("x", w - 25)
                .attr("width",  25)
                .attr("height",  25)
                .style("fill", colNodeScaleSeparateInfo);

            legend.append("text")
                .attr("x", w - 35)
                .attr("y", 12.5)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function(d) { return d; });

            d3.select("#download").on("click", function(){
                d3.select(this)
                    .attr("href", 'data:application/octet-stream;base64,' + btoa(d3.select("#chart").html()))
                    .attr("download", "pathway_network.svg")
            })
        }


        function updatePhospho(nodes, links) {
            //
            //var svg;
            svg3.remove();

            var margin = 100,
                w = 1500 -2*margin,
                h = w,
                radius = w / 2,
                strokeWidth = 4,
                hyp2 = Math.pow(radius, 2),
                nodeBaseRad = 5;

            svg3 = d3.select("#chart3")
                .append("svg")
                .attr("style", "outline: thin solid blue;")
                .attr("width", w)
                .attr("height", h);

            // var pool = svg.append('circle')
            //     .style('stroke-width', strokeWidth * 2)
            //     .style('stroke-width', strokeWidth * 2)
            //     .attr({
            //         class: 'pool',
            //         r: radius,
            //         index: -1,
            //         cy: 0,
            //         cx: 0,
            //         transform: 'translate(' + w / 2 + ',' + h / 2 + ')'
            //     });

            force = d3.layout.force()
                .nodes(nodes)
                .links(links)
                .size([w, h])
                .gravity(.25)
                .linkDistance(100)
                .charge(-500)
                //.gravity(0.05)
                .on("tick", tick)
                .start();


            xScale.domain(d3.extent(nodes, function (d) { return d.weight; }));
            colNodeScale.domain(d3.extent(nodes, function (d) { return d.group; }));
            colScale.domain(d3.extent(links, function (d) { return d.weight; }));
            edgeWeightScale.domain(d3.extent(links, function (d) { return d.value; }));

            //var edgeWeightScale = d3.scale.linear().range([1, 300]);

//             function linkMouseover(d){
//                 chart.selectAll(".node").classed("active", function(p) { return d3.select(this).classed("active") || p === d.source || p === d.target; });
//             }
// // Highlight the node and connected links on mouseover.
//             function nodeMouseover(d) {
//                 chart.selectAll(".link").classed("active", function(p) { return d3.select(this).classed("active") || p.source === d || p.target === d; });
//                 chart.selectAll(".link.active").each(function(d){linkMouseover(d)})
//                 d3.select(this).classed("active", true);
//             }



            var path = svg3.append("svg:g").selectAll("path")
            //.data(links)
                .data(force.links())
                .attr("r", function (d) { return xScale(d.weight); })
                .enter().append("svg:path")
                .style("stroke-width", function (d) { return edgeWeightScale(d.value) + "px"; })
                .attr("stroke-dasharray",function(d){
                    if(d.value < 100){
                        return "5,5"; //these classes are defined in custom.css
                    } else {
                        return "5,0";//these classes are defined in custom.css
                    }
                })
                //.style("stroke-dasharray", function (d) { return edgeWeightScale(d.value) + "px"; })
                //.style("stroke", function (d) {return colScale(d.value); })
                .attr("class", function(d) { return "link"; });


            var text = svg3.append("svg:g").selectAll("g")
                .data(force.nodes())
                .enter().append("svg:g");
            // .on("mouseover", function(d) {
            //
            //     )};

            // A copy of the text with a thick white stroke for legibility.
            text.append("svg:text")
                .attr("x", 12)
                .attr("y", ".31em")
                .attr("class", "shadow")
                .text(function(d) { return d.name; });

            text.append("svg:text")
                .attr("x", 12)
                .attr("y", ".31em")
                .text(function(d) { return d.name; });
            // .on("mouseover", function(){ console.log("mouseOver"); d3.select(this).select("text").style("fill", "#000");} )
            // .on("mouseout", function(){ console.log("mouseOut"); d3.select(this).select("text").style("fill", "#ccc");} ); ;

            // function randomNodes(n) {
            //     var data = [],
            //         range = d3.range(n);
            //
            //     for (var i = range.length - 1; i >= 0; i--) {
            //         data.push({
            //             rad: Math.floor(Math.random() * 12)
            //         });
            //     }
            //     return data;
            // }


            var circle = svg3.append("svg:g").selectAll("circle")
            //.data(nodes)
                .data(force.nodes())
                // for (var i = range.length - 1; i >= 0; i--) {
                //     data.push({
                //         rad: Math.floor(Math.random() * 12)
                //     });
                // }
                .enter().append("svg:circle")
                .attr("r", function (d) { return xScale(d.weight); })
                .style("fill", function(d) { return colNodeScale(d.group); })
                .on("dblclick", dblclick)
                .call(force.drag)
                .on("mouseover", function(d) {
                    d3.select(this).append("text")
                        .attr("x", 12)
                        .attr("y", ".31em")
                        .attr("class", "shadow")
                        .text( d.name);

                    //d3.selectAll("text").remove();
                    d3.select(this).style("stroke-width", 6);

                    d3.select(this).style("stroke", "blue");

                    var nodeNeighbors = links.filter(function(link) {
                        // Filter the list of links to only those links that have our target
                        // node as a source or target
                        return link.source.index === d.index || link.target.index === d.index;})
                        .map(function(link) {
                            // Map the list of links to a simple array of the neighboring indices - this is
                            // technically not required but makes the code below simpler because we can use
                            // indexOf instead of iterating and searching ourselves.
                            return link.source.index === d.index ? link.target.index : link.source.index; });

                    d3.selectAll('circle').filter(function(node) {
                        // I filter the selection of all circles to only those that hold a node with an
                        // index in my listg of neighbors
                        return nodeNeighbors.indexOf(node.index) > -1;
                    })
                        .style('stroke', 'blue')

                    //d3.selectAll('text').filter(d).style('fill', 'blue');

                    d3.selectAll('text').filter(function(node) {
                        // I filter the selection of all circles to only those that hold a node with an
                        // index in my listg of neighbors
                        return nodeNeighbors.indexOf(node.index) > -1;
                    }).style('fill', 'blue')
                    //.style("font-size", "16px")
                        .style("font-weight", "bold");

                    path.style('stroke', function(l) {
                        if (d === l.source || d === l.target)
                            return "blue";
                        else
                            return "grey";
                    })

                    // path.style('stroke-width', function(l) {
                    //     if (d === l.source || d === l.target)
                    //         return 3;
                    //     else
                    //         return 1;
                    // })

                })
                .on("mouseout",  function(d) {
                    //d3.select(this).classed("hover", false);
                    // if(isConnected(d, o)) {
                    //svg.selectAll('circle').style('stroke', 'black');
                    //d3.select(this).style("stroke-width", 3);
                    d3.select(this).style("stroke", "#333");
                    // d3.select(this).select("circle").style("stroke", "black");
                    // d3.select(this).select("text").style("font", "12px sans-serif");
                    // d3.selectAll("rect." + d.location).style("stroke-width", 1);
                    // d3.selectAll("rect." + d.location).style("stroke", "gray");
                    // d3.selectAll("text." + d.location).style("font", "12px sans-serif");
                    // d3.selectAll("tr." + d.name).style("background-color", "white");
                    path.style('stroke', "grey");
                    //path.style('stroke-width', 1);
                    //circle.style('stroke', "grey");
                    circle.style("stroke-width", 3);
                    circle.style("stroke", "#333");
                    d3.selectAll('text').style('fill', 'black')
                        .style("font-weight", "normal");
                    //.style("font-size", "12px");
                    //}
                });


            function pythag(r, b, coord) {
                r += nodeBaseRad;

                // force use of b coord that exists in circle to avoid sqrt(x<0)
                b = Math.min(w - r - strokeWidth, Math.max(r + strokeWidth, b));

                var b2 = Math.pow((b - radius), 2),
                    a = Math.sqrt(hyp2 - b2);

                // radius - sqrt(hyp^2 - b^2) < coord < sqrt(hyp^2 - b^2) + radius
                coord = Math.max(radius - a + r + strokeWidth,
                    Math.min(a + radius - r - strokeWidth, coord));

                return coord;
            }

            function tick(e) {
                path.attr("d", function(d) {
                    var dx = d.target.x - d.source.x,
                        dy = d.target.y - d.source.y,

                        dr = Math.sqrt(dx * dx + dy * dy);
                    //console.log(d.source.x);
                    // console.log(d.target.x);
                    return "M" + d.source.x + "," + d.source.y + ","+ d.target.x + "," + d.target.y;
                    //return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                });

                circle.attr('x', function (d) { return d.x = pythag(Math.random() * 12, d.y, d.x); })
                    .attr('y', function (d) { return d.y = pythag(Math.random() * 12, d.x, d.y); })
                    .attr("transform", function(d) {
                        return "translate(" + d.x + "," + d.y + ")"});

                // circle.attr("transform", function(d) {
                //     return "translate(" + d.x + "," + d.y + ")";
                // });

                text.attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
            }
            //For not moving after drag
            var drag = force.drag()
                .on("dragstart", dragstart);

            //For not moving after drag
            function dblclick(d) {
                d3.select(this).classed("fixed", d.fixed = false);
            }
            //For not moving after drag
            function dragstart(d) {
                d3.select(this).classed("fixed", d.fixed = true);
            }


            // For legend
            var colNodeScaleSeparateInfo = d3.scale.ordinal()
                .range(["#767776", "#f91104"])
                .domain(["Query Gene Set","Kinases Perturbation"]);


            var legend = svg3.selectAll(".legend")
                .data(colNodeScaleSeparateInfo.domain())
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return "translate(0," + (i) * 25 + ")"; });

            legend.append("rect")
                .attr("x", w - 25)
                .attr("width",  25)
                .attr("height",  25)
                .style("fill", colNodeScaleSeparateInfo);

            legend.append("text")
                .attr("x", w - 35)
                .attr("y", 12.5)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function(d) { return d; });

            d3.select("#download3").on("click", function(){
                d3.select(this)
                    .attr("href", 'data:application/octet-stream;base64,' + btoa(d3.select("#chart3").html()))
                    .attr("download", "phospho_network.svg")
            })
        }




        function updateKinase(nodes, links) {
            // d3.select("svg").remove();
            svg2.remove();
            console.log("In update kinase")
            var margin = 100,
                w = 1500 -2*margin,
                h = w,
                radius = w / 2,
                strokeWidth = 4,
                hyp2 = Math.pow(radius, 2),
                nodeBaseRad = 5;

            svg2 = d3.select("#chart2")
                .append("svg")
                .attr("style", "outline: thin solid blue;")
                .attr("width", w)
                .attr("height", h);

            // var pool = svg.append('circle')
            //     .style('stroke-width', strokeWidth * 2)
            //     .style('stroke-width', strokeWidth * 2)
            //     .attr({
            //         class: 'pool',
            //         r: radius,
            //         index: -1,
            //         cy: 0,
            //         cx: 0,
            //         transform: 'translate(' + w / 2 + ',' + h / 2 + ')'
            //     });

            force = d3.layout.force()
                .nodes(nodes)
                .links(links)
                .size([w, h])
                .gravity(.25)
                .linkDistance(100)
                .charge(-500)
                //.gravity(0.05)
                .on("tick", tick)
                .start();


            xScale.domain(d3.extent(nodes, function (d) { return d.weight; }));
            colNodeScaleSeparate.domain(d3.extent(nodes, function (d) { return d.group; }));
            colScale.domain(d3.extent(links, function (d) { return d.weight; }));



//             function linkMouseover(d){
//                 chart.selectAll(".node").classed("active", function(p) { return d3.select(this).classed("active") || p === d.source || p === d.target; });
//             }
// // Highlight the node and connected links on mouseover.
//             function nodeMouseover(d) {
//                 chart.selectAll(".link").classed("active", function(p) { return d3.select(this).classed("active") || p.source === d || p.target === d; });
//                 chart.selectAll(".link.active").each(function(d){linkMouseover(d)})
//                 d3.select(this).classed("active", true);
//             }



            svg2.append('defs').append('marker')
                .attr({'id':'arrowhead',
                    'viewBox':'-0 -5 10 10',
                    'refX':25,
                    'refY':0,
                    //'markerUnits':'strokeWidth',
                    'orient':'auto',
                    'markerWidth':5,
                    'markerHeight':6,
                    'xoverflow':'visible'})
                .append('svg:path')
                .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
                .attr('fill', 'black')
                .attr('stroke','#ccc');


            var path = svg2.append("svg:g").selectAll("path")
            //.data(links)
                .data(force.links())
                .enter().append("svg:path")
                .style("stroke", function (d) {return colScale(d.value); })
                //.attr("marker-end", function(d) { return "url(#" + d.type + ")"; })
                .attr("class", function(d) { return "link "; })
                .attr('marker-end','url(#arrowhead)');
                //.attr("marker-end", "url(#arrow)");


            var text = svg2.append("svg:g").selectAll("g")
                .data(force.nodes())
                .enter().append("svg:g");
            // .on("mouseover", function(d) {
            //
            //     )};

            // A copy of the text with a thick white stroke for legibility.
            text.append("svg:text")
                .attr("x", 12)
                .attr("y", ".31em")
                .attr("class", "shadow")
                .text(function(d) { return d.name; });

            text.append("svg:text")
                .attr("x", 12)
                .attr("y", ".31em")
                .text(function(d) { return d.name; });
            // .on("mouseover", function(){ console.log("mouseOver"); d3.select(this).select("text").style("fill", "#000");} )
            // .on("mouseout", function(){ console.log("mouseOut"); d3.select(this).select("text").style("fill", "#ccc");} ); ;

            // function randomNodes(n) {
            //     var data = [],
            //         range = d3.range(n);
            //
            //     for (var i = range.length - 1; i >= 0; i--) {
            //         data.push({
            //             rad: Math.floor(Math.random() * 12)
            //         });
            //     }
            //     return data;
            // }


            // var city = svg.selectAll(".city")
            //     .data(cities)
            //     .enter().append("g")
            //     .attr("class", "city");
            //
            // city.append("path")
            //     .attr("class", "line")
            //     .attr("d", function(d) { return line(d.values); })
            //     .attr("data-legend",function(d) { return d.name})
            //     .style("stroke", function(d) { return color(d.name); });


            var circle = svg2.append("svg:g").selectAll("circle")
            //.data(nodes)
                .data(force.nodes())
                .enter().append("svg:circle")
                .attr("r", function (d) { return xScale(d.weight); })
                //.attr("data-legend",function(d) { return d.group})
                .style("fill", function(d) { return colNodeScaleSeparate(d.group); })
                //.style("fill", function(d) { return color(d.type); })
                .on("dblclick", dblclick)
                .call(force.drag)

                //.call(drag)

                .on("mouseover", function(d) {
                    d3.select(this).append("text")
                        .attr("x", 12)
                        .attr("y", ".31em")
                        .attr("class", "shadow")
                        .text( d.name);

                    //d3.selectAll("text").remove();
                    d3.select(this).style("stroke-width", 6);

                    d3.select(this).style("stroke", "blue");

                    var nodeNeighbors = links.filter(function(link) {
                        // Filter the list of links to only those links that have our target
                        // node as a source or target
                        return link.source.index === d.index || link.target.index === d.index;})
                        .map(function(link) {
                            // Map the list of links to a simple array of the neighboring indices - this is
                            // technically not required but makes the code below simpler because we can use
                            // indexOf instead of iterating and searching ourselves.
                            return link.source.index === d.index ? link.target.index : link.source.index; });

                    d3.selectAll('circle').filter(function(node) {
                        // I filter the selection of all circles to only those that hold a node with an
                        // index in my listg of neighbors
                        return nodeNeighbors.indexOf(node.index) > -1;
                    })
                        .style('stroke', 'blue')

                    //d3.selectAll('text').filter(d).style('fill', 'blue');

                    d3.selectAll('text').filter(function(node) {
                        // I filter the selection of all circles to only those that hold a node with an
                        // index in my listg of neighbors
                        return nodeNeighbors.indexOf(node.index) > -1;
                    }).style('fill', 'blue')
                    //.style("font-size", "16px")
                        .style("font-weight", "bold");

                    path.style('stroke', function(l) {
                        if (d === l.source || d === l.target)
                            return "blue";
                        else
                            return "grey";
                    })

                    path.style('stroke-width', function(l) {
                        if (d === l.source || d === l.target)
                            return 3;
                        else
                            return 1;
                    })

                })
                .on("mouseout",  function(d) {
                    //d3.select(this).classed("hover", false);
                    // if(isConnected(d, o)) {
                    //svg.selectAll('circle').style('stroke', 'black');
                    d3.select(this).style("stroke-width", 3);
                    d3.select(this).style("stroke", "#333");
                    // d3.select(this).select("circle").style("stroke", "black");
                    // d3.select(this).select("text").style("font", "12px sans-serif");
                    // d3.selectAll("rect." + d.location).style("stroke-width", 1);
                    // d3.selectAll("rect." + d.location).style("stroke", "gray");
                    // d3.selectAll("text." + d.location).style("font", "12px sans-serif");
                    // d3.selectAll("tr." + d.name).style("background-color", "white");
                    path.style('stroke', "grey");
                    path.style('stroke-width', 1);
                    //circle.style('stroke', "grey");
                    circle.style("stroke-width", 3);
                    circle.style("stroke", "#333");
                    d3.selectAll('text').style('fill', 'black')
                        .style("font-weight", "normal");
                    //.style("font-size", "12px");
                    //}
                });


            function pythag(r, b, coord) {
                r += nodeBaseRad;

                // force use of b coord that exists in circle to avoid sqrt(x<0)
                b = Math.min(w - r - strokeWidth, Math.max(r + strokeWidth, b));

                var b2 = Math.pow((b - radius), 2),
                    a = Math.sqrt(hyp2 - b2);

                // radius - sqrt(hyp^2 - b^2) < coord < sqrt(hyp^2 - b^2) + radius
                coord = Math.max(radius - a + r + strokeWidth,
                    Math.min(a + radius - r - strokeWidth, coord));

                return coord;
            }

            function tick(e) {
                path.attr("d", function(d) {
                    var dx = d.target.x - d.source.x,
                        dy = d.target.y - d.source.y,
                        dr = Math.sqrt(dx * dx + dy * dy),
                        drx = dr,
                        dry = dr,
                        xRotation = 0, // degrees
                        largeArc = 0, // 1 or 0
                        sweep = 1, // 1 or 0
                    x2 = d.target.x,
                    y2 = d.target.y;
                    //console.log(d.source.x);
                    // console.log(d.target.x);

                    if ( d.target.x === d.source.x && d.target.y === d.source.y ) {
                        // Fiddle with this angle to get loop oriented.
                        xRotation = -45;

                        // Needs to be 1.
                        largeArc = 1;

                        // Change sweep to change orientation of loop.
                        //sweep = 0;

                        // Make drx and dry different to get an ellipse
                        // instead of a circle.
                        drx = 30;
                        dry = 20;

                        // For whatever reason the arc collapses to a point if the beginning
                        // and ending points of the arc are the same, so kludge it.
                        x2 = d.target.x + 1;
                        y2 = d.target.y + 1;
                    }

                    return "M" + d.source.x + "," + d.source.y + "A" + drx + "," + dry + " " + xRotation + "," + largeArc + "," + sweep + " " + x2 + "," + y2;


                    //return "M" + d.source.x + "," + d.source.y + ","+ d.target.x + "," + d.target.y;
                    //return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                });

                circle.attr('x', function (d) { return d.x = pythag(Math.random() * 12, d.y, d.x); })
                    .attr('y', function (d) { return d.y = pythag(Math.random() * 12, d.x, d.y); })
                    .attr("transform", function(d) {
                        return "translate(" + d.x + "," + d.y + ")"});

                // circle.attr("transform", function(d) {
                //     return "translate(" + d.x + "," + d.y + ")";
                // });

                text.attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
            }

            //For not moving after drag
            var drag = force.drag()
                .on("dragstart", dragstart);

            //For not moving after drag
            function dblclick(d) {
                d3.select(this).classed("fixed", d.fixed = false);
            }
            //For not moving after drag
            function dragstart(d) {
                d3.select(this).classed("fixed", d.fixed = true);
            }


            // For legend
            var colNodeScaleSeparateInfo = d3.scale.ordinal()
                .range(["#767776", "#f91104", "#0af702"])
                .domain(["Query Gene Set","Activating Kinases, Phosphorylating the Query Gene Set","Down Stream Gene Sets, Phosphorylated by the Gene Set"]);


            var legend = svg2.selectAll(".legend")
                .data(colNodeScaleSeparateInfo.domain())
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return "translate(0," + (i) * 25 + ")"; });

            legend.append("rect")
                .attr("x", w - 25)
                .attr("width",  25)
                .attr("height",  25)
                .style("fill", colNodeScaleSeparateInfo);

            legend.append("text")
                .attr("x", w - 35)
                .attr("y", 12.5)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function(d) { return d; });






            d3.select("#download2").on("click", function(){
                d3.select(this)
                    .attr("href", 'data:application/octet-stream;base64,' + btoa(d3.select("#chart2").html()))
                    .attr("download", "kinase_network.svg")
            })
        }



        // +++++++++++++++++++++++++++++++++++++++++
        // +++++++++++++++++++++++++++++++++++++++++
        // Enrichr pathway analysis



        // config references for the spinner while waiting for the data loading
        var opts = {
            lines: 9, // The number of lines to draw
            length: 9, // The length of each line
            width: 5, // The line thickness
            radius: 30, // The radius of the inner circle
            color: '#EE3124', // #rgb or #rrggbb or array of colors
            speed: 1.9, // Rounds per second
            trail: 40, // Afterglow percentage
            className: 'spinner', // The CSS class to assign to the spinner
            top: '49%', // Top position relative to parent
            left: '50%', // Left position relative to parent
            shadow: true, // Whether to render a shadow
            hwaccel: true // Whether to use hardware acceleration
            //, position: 'absolute' // Element positioning
        };

        var chartConfig = {
            target : 'chart'
        };

        var chartConfig2 = {
            target2 : 'chart2'
        };

        var chartConfig3 = {
            target3 : 'chart3'
        };

        var target = document.getElementById(chartConfig.target);
        var target2 = document.getElementById(chartConfig2.target2);
        var target3 = document.getElementById(chartConfig3.target3);

        if (self.parsedGenes.length > 0) {
            //var spinner = new Spinner(opts).spin(target);
            $http.get("api/network/genes/" + self.parsedGenes)
                .success(function (apiNetwork) {
                    self.showGeneNetworkProcessed = true;
                    //spinner.stop();
                    self.network = apiNetwork;
                    console.log(self.network);


                    $scope.pathways = [
                        {value: "KEGG_2013"},
                        {value: "KEGG_2015"},
                        {value: "KEGG_2016"},
                        {value: "WikiPathways_2013"},
                        {value: "WikiPathways_2015"},
                        {value: "WikiPathways_2016"},
                        {value: "Panther_2015"},
                        {value: "Panther_2016"},
                        {value: "Kinase_Perturbations_from_GEO_up"},
                        {value: "Kinase_Perturbations_from_GEO_down"},
                        {value: "LINCS_L1000_Kinase_Perturbations_up"},
                        {value: "LINCS_L1000_Kinase_Perturbations_down"},
                        {value: "Kinase_Perturbations_from_GEO"}
                    ];
                    $scope.selectedPathways = $scope.pathways[2];
                    var network = self.network.KEGG_2016;
                    update(network.nodes, network.edges);
                    $scope.changedValue = function (item) {
                        //var net = item.value;

                        console.log(item);
                        console.log(item.value);
                        var net = item.value.toString();
                        console.log(net);

                        var network = self.network[net];
                        console.log('network');
                        console.log(network);
                        update(network.nodes, network.edges);
                        //$scope.itemList.push(item.value);
                    }

                    console.log(self.network);

                })
                .error(function () {
                    console.log("Error in obtaining network from api/network/genes/");
                });
        }

        // +++++++++++++++++++++++++++++++++++++++++
        // +++++++++++++++++++++++++++++++++++++++++
        // Kinase pathway analysis


        if (self.parsedGenes.length > 0) {
            //var spinner2 = new Spinner(opts).spin(target2);
            $http.get("api/kinase/genes/" + self.parsedGenes)
                .success(function (apiKinaseNetwork) {

                    self.showKinaseNetworkProcessed = true;
                    //spinner2.stop();
                    console.log("kinaseNetwork");

                    self.kinaseNetwork = apiKinaseNetwork;
                    console.log(self.kinaseNetwork);

                    updateKinase(self.kinaseNetwork.nodes, self.kinaseNetwork.edges);

                    console.log(self.kinaseNetwork);

                })
                .error(function () {
                    console.log("Error in obtaining network from api/kinase/genes/");
                });
        }





        // +++++++++++++++++++++++++++++++++++++++++
        // +++++++++++++++++++++++++++++++++++++++++
        // Kinase pathway analysis for phosphorylated genes

        if (self.parsedPhosphoGenes.length > 0) {
            self.parsedPhosphoGenes.push(self.organism);
            console.log("self.parsedPhosphoGenes");
            console.log(self.parsedPhosphoGenes);
            //var spinner3 = new Spinner(opts).spin(target3);
            $http.get("api/phospho/genes/" + self.parsedPhosphoGenes)
                .success(function (apiPhosphoNetwork) {

                    self.showPhosphoGeneNetworkProcessed = true;
                    //spinner3.stop();
                    self.phosphoNetwork = apiPhosphoNetwork;
                    console.log(self.phosphoNetwork);

                    // network.put("Known_Kinase_TargetGene", definite_Kinase_Gene_Network);
                    // network.put("Known+Blosum50_Exact_Match_Kinase_TargetGene", definite_blosum_Kinase_Gene_Network);
                    // network.put("Known+Predicted_Probability_Kinase_TargetGene", indefinite_Kinase_Gene_Network);
                    // network.put("Known+Predicted_Blosum50_Kinase_TargetGene", blosum_Kinase_Gene_Network);

                    $scope.phosphoOptions = [
                        {value: "Known_Kinase_TargetGene"},
                        {value: "Known+Predicted_Blosum50_Kinase_TargetGene"},
                        {value: "Known+Predicted_Probability_Kinase_TargetGene"}
                    ];

                    $scope.selectedphosphoPathways = $scope.phosphoOptions[0];
                    var pNetwork = self.phosphoNetwork.Known_Kinase_TargetGene;
                    self.blosum50Table = self.phosphoNetwork.Blosum50_table;
                    updatePhospho(pNetwork.nodes, pNetwork.edges);
                    $scope.changedPhosphoValue = function (item) {
                        //var net = item.value;
                        console.log(item);
                        console.log(item.value);
                        var net = item.value.toString();
                        console.log(net);

                        var pNetwork = self.phosphoNetwork[net];
                        console.log('network');
                        console.log(pNetwork);
                        updatePhospho(pNetwork.nodes, pNetwork.edges);
                        //$scope.itemList.push(item.value);
                    }

                    console.log(self.phosphoNetwork);

                })
                .error(function () {
                    console.log("Error in obtaining network from api/phospho/genes/");
                });
        }


        self.waitingPathway = false;
        self.showOutputPathway = true;
        // self.waitingPathway = false;
        // self.showOutputPathway = true;
    }




}]);