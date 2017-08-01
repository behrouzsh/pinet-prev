/**
 * Created by chojnasm on 11/9/15.
 * Modified by Behrouz on 8/22/16.
 */
var app = angular.module('plnApplication', ['plnModule']);

app.filter('treeJSON', function () {
    function prettyPrintJson(json) {
        return JSON ? '\n' + JSON.stringify(json, null, ' ') : 'your browser does not support JSON so can not show the Json format.';
    }

    return prettyPrintJson;
});

app.filter('inline', function () {
    function inlinePLN(plnArray) {
        var output = '\n';
        var layerSep;
        var groupSep;
        var itemSep;
        var FormatREF;
        var FormatSYM;
        var FormatDES;
        var FormatVAR;
        var FormatPTM;
        for (var i = 0; i < plnArray.length; i++) {
            var plnLocal = plnArray[i];

            var plnKey = Object.keys(plnLocal.PLN)[0];
            var plnValue = plnLocal.PLN[plnKey];

            var refKey = Object.keys(plnLocal.REF)[0];
            var refValue = plnLocal.REF[refKey];

            var symKey = Object.keys(plnLocal.SYM)[0];
            var symValue = plnLocal.SYM[symKey];

            var PTM = [];
            itemSep = "&";
            if (plnValue == "InChl-like") {
                layerSep = "/";
                groupSep = ";";
                FormatREF = "r=";
                FormatSYM = "s=";
                FormatDES = "d=";
                FormatVAR = "v=";
                FormatPTM = "m=";
            } else {
                layerSep = ";";
                groupSep = ",";
                FormatREF = " REF = ";
                FormatSYM = " SYM = ";
                FormatDES = " DES = ";
                FormatVAR = " VAR = ";
                FormatPTM = " PTM = ";

            }


            plnLocal.PTM.map(function (ptmGroup) {
                    //console.log(ptmGroup);

                    var ptmForHit = [];

                    for (var index = 0; index < ptmGroup.length; index++) {
                        ptmForHit.push(ptmGroup[index].identifier + "@" + ptmGroup[index].location);
                    }

                    PTM.push(ptmForHit.join(itemSep));
                }
            );

            output = output +
                "PLN=" + plnKey + ":" + plnValue + layerSep +
                FormatREF + refKey + ":" + refValue.join(groupSep + refKey + ":") + layerSep +
                FormatSYM + symKey + ":" + symValue.join(groupSep + symKey + ":") + layerSep +
                FormatDES + layerSep +
                FormatVAR + layerSep +
                FormatPTM + PTM.join(groupSep) + "#" + "\n\n";


        }
        return output;
    }

    return inlinePLN;
});