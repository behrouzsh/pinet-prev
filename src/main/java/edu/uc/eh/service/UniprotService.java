package edu.uc.eh.service;


import edu.uc.eh.utils.UtilsNetwork;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


import java.util.Map;

//import java.util.Map;

/**
 * Created by behrouzsh on 9/2/16.
 */

@Service
public class UniprotService {

    private static final Logger log = LoggerFactory.getLogger(UniprotService.class);

    @Value("${urls.uniprot}")
    String uniprotTemplate;

    public JSONObject getTable(String[] proteinAndOrganism) {

        String response;
        //String xmlResponse;
        String uniprotUrl = String.format(uniprotTemplate, proteinAndOrganism[0], proteinAndOrganism[1]);
        Map uniprotMap;
        log.info("Querying: " + uniprotUrl);


        try {
            response = UtilsNetwork.getInstance().readUrlXml(uniprotUrl);
            //log.info("Response from readXml: ");

            uniprotMap = UtilsNetwork.loadXMLFromString(response);
            //System.out.println("uniprotMap:" + uniprotMap.toString());
        } catch (Exception e) {

            String msg =  String.format("Protein %s not found", proteinAndOrganism[0]);
            log.warn(msg);
            throw new RuntimeException(msg);

        }



        //String uniprotJson = "{\"length\": "+uniprotMap.get("length").toString()+", \"sequence\": \""+uniprotMap.get("sequence").toString()+"\"}";

        JSONObject uniprotJsonSecond = new JSONObject(uniprotMap);
        //System.out.println("JsonFormat");
        //System.out.println(uniprotJsonSecond.toString());

        return uniprotJsonSecond;
        //return uniprotMap;//.toString();
    }

}
