package edu.uc.eh.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Created by behrouz on 1/11/17.
 */

@Service
public class PirService {

    private static final Logger log = LoggerFactory.getLogger(PirService.class);

    @Value("${urls.pir}")
    String PirTemplate;

//    public JSONObject getTable(String peptide) {
//
//        String response;
//        //String xmlResponse;
//        String PirUrl = String.format(PirTemplate, peptide);
//        JSONObject PirJson;
//        log.info("Querying: " + PirUrl);
//
//
//        try {
//            response = UtilsNetwork.getInstance().readUrlXml(PirUrl);
//            //log.info("Response from readXml: ");
//
//            PirJson = UtilsNetwork.loadXMLFromString(response);
//            //System.out.println("uniprotMap:" + uniprotMap.toString());
//        } catch (Exception e) {
//
//            String msg =  String.format("Peptide %s not found", peptide);
//            log.warn(msg);
//            throw new RuntimeException(msg);
//
//        }
//
//
//
//        //String uniprotJson = "{\"length\": "+uniprotMap.get("length").toString()+", \"sequence\": \""+uniprotMap.get("sequence").toString()+"\"}";
//
//        JSONObject peptideJson = new JSONObject(PirMap);
//        //System.out.println("JsonFormat");
//        //System.out.println(uniprotJsonSecond.toString());
//
//        return peptideJson;
//        //return uniprotMap;//.toString();
//    }
}
