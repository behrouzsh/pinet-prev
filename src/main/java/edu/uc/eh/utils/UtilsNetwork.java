package edu.uc.eh.utils;

//import org.json.JSONException;
//import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;




/**
 * Created by chojnasm on 11/17/15.
 * Edited by Behrouzsh on 9/6/16.
 */
public class UtilsNetwork {

    private static final Logger log = LoggerFactory.getLogger(UtilsNetwork.class);
    private static UtilsNetwork instance;

    private UtilsNetwork() {
    }

    static {
        instance = new UtilsNetwork();
    }

    public static UtilsNetwork getInstance(){return instance;}

    public String readUrl(String urlString) throws Exception {
        BufferedReader reader = null;
        try {
            URL url = new URL(urlString);
            reader = new BufferedReader(new InputStreamReader(url.openStream()));
            StringBuffer buffer = new StringBuffer();
            int read;
            char[] chars = new char[1024];
            while ((read = reader.read(chars)) != -1)
                buffer.append(chars, 0, read);
            return buffer.toString().replace('\'','\"');
        } finally {
            if (reader != null)
                reader.close();
        }
    }

//    public JSONObject loadJSONFromJSON(String urlString) throws Exception {
//        BufferedReader reader = null;
//        try {
//            URL url = new URL(urlString);
//            reader = new BufferedReader(new InputStreamReader(url.openStream()));
//            StringBuffer buffer = new StringBuffer();
//            int read;
//            char[] chars = new char[1024];
//            while ((read = reader.read(chars)) != -1)
//                buffer.append(chars, 0, read);
//            return new JSONObject(buffer);
//        } finally {
//            if (reader != null)
//                reader.close();
//        }
//    }

    public String readUrlXml(String urlString) throws Exception {
        BufferedReader reader = null;
        try {
            URL url = new URL(urlString);
            reader = new BufferedReader(new InputStreamReader(url.openStream()));
            StringBuffer buffer = new StringBuffer();
            int read;
            char[] chars = new char[1024];
            while ((read = reader.read(chars)) != -1)
                buffer.append(chars, 0, read);
            return buffer.toString();
        } finally {
            if (reader != null)
                reader.close();
        }
    }


    public static Map loadJSONFromStringHarmonizomeGene(String json) throws Exception
    {

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        InputSource is = new InputSource(new StringReader(json));
        Document doc = builder.parse(is);
        Map<String, Object> proteinToUniprotMap = new HashMap<String, Object>();
        //Map proteinToUniprotMap = new HashMap();

        // get the first element
        doc.getDocumentElement().normalize();
        //System.out.println("Root element :" + doc.getDocumentElement().getNodeName());
        //Element root = doc.getDocumentElement();
        NodeList uniprotNodeList = doc.getElementsByTagName("symbol");
        Node entryNode = uniprotNodeList.item(0);
        NodeList entryNodeList = entryNode.getChildNodes();
        //int found = 0;
        if (entryNodeList != null && entryNodeList.getLength() > 0) {
            for (int i = 0; i < entryNodeList.getLength(); i++) {
                Node entryNodeListNode = entryNodeList.item(i);

                if(entryNodeListNode.getNodeName() == "gene")
                {

                    //if (found == 0) {
                    NodeList geneNodeList = entryNodeListNode.getChildNodes();
                    proteinToUniprotMap.put("gene_id", geneNodeList.item(1).getTextContent());
                    //   found = 1;
//                    log.info("========================");
//                    log.info(geneNodeList.item(1).getTextContent());
//                    log.info("++++++++++++++++++++");
                    // }

                }


                if(entryNodeListNode.getNodeName() == "sequence") {
                    Element sequenceElement = (Element)entryNodeListNode;

                    proteinToUniprotMap.put("length", sequenceElement.getAttribute("length"));
                    log.info(entryNodeList.item(i).getTextContent());
                    proteinToUniprotMap.put("sequence", entryNodeList.item(i).getTextContent().replace("\n", ""));
                }



            }
        }


        return proteinToUniprotMap;

    }





//    public static Map loadJSONFromString(String json) throws Exception
//    {
//
//        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
//        DocumentBuilder builder = factory.newDocumentBuilder();
//        InputSource is = new InputSource(new StringReader(json));
//        Document doc = builder.parse(is);
//        Map<String, Object> proteinToUniprotMap = new HashMap<String, Object>();
//        //Map proteinToUniprotMap = new HashMap();
//
//        // get the first element
//        doc.getDocumentElement().normalize();
//        //System.out.println("Root element :" + doc.getDocumentElement().getNodeName());
//        //Element root = doc.getDocumentElement();
//        NodeList uniprotNodeList = doc.getElementsByTagName("entry");
//        Node entryNode = uniprotNodeList.item(0);
//        NodeList entryNodeList = entryNode.getChildNodes();
//        //int found = 0;
//        if (entryNodeList != null && entryNodeList.getLength() > 0) {
//            for (int i = 0; i < entryNodeList.getLength(); i++) {
//                Node entryNodeListNode = entryNodeList.item(i);
//
//                if(entryNodeListNode.getNodeName() == "gene")
//                {
//
//                    //if (found == 0) {
//                        NodeList geneNodeList = entryNodeListNode.getChildNodes();
//                        proteinToUniprotMap.put("gene_id", geneNodeList.item(1).getTextContent());
//                     //   found = 1;
////                    log.info("========================");
////                    log.info(geneNodeList.item(1).getTextContent());
////                    log.info("++++++++++++++++++++");
//                   // }
//
//                }
//
//
//                if(entryNodeListNode.getNodeName() == "sequence") {
//                    Element sequenceElement = (Element)entryNodeListNode;
//
//                    proteinToUniprotMap.put("length", sequenceElement.getAttribute("length"));
//                    log.info(entryNodeList.item(i).getTextContent());
//                    proteinToUniprotMap.put("sequence", entryNodeList.item(i).getTextContent().replace("\n", ""));
//                }
//
//
//
//            }
//        }
//
//
//        return proteinToUniprotMap;
//
//    }



    public static Map loadXMLFromString(String xml) throws Exception
    {

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        InputSource is = new InputSource(new StringReader(xml));
        Document doc = builder.parse(is);
        Map<String, Object> proteinToUniprotMap = new HashMap<String, Object>();
        ArrayList proteinToGeneList = new ArrayList();
        //Map proteinToUniprotMap = new HashMap();

        // get the first element
        doc.getDocumentElement().normalize();
        //System.out.println("Root element :" + doc.getDocumentElement().getNodeName());
        //Element root = doc.getDocumentElement();
        NodeList uniprotNodeList = doc.getElementsByTagName("entry");
        Node entryNode = uniprotNodeList.item(0);
        NodeList entryNodeList = entryNode.getChildNodes();
        //int found = 0;
        if (entryNodeList != null && entryNodeList.getLength() > 0) {
            for (int i = 0; i < entryNodeList.getLength(); i++) {
                Node entryNodeListNode = entryNodeList.item(i);

                if(entryNodeListNode.getNodeName() == "gene") {

                    //if (found == 0) {
                    NodeList geneNodeList = entryNodeListNode.getChildNodes();
                    proteinToGeneList.add(geneNodeList.item(1).getTextContent());
                        //found = 1;
//                    log.info("========================");
//                    log.info(geneNodeList.item(1).getTextContent());
//                    log.info("++++++++++++++++++++");
                    //}

                }


                if(entryNodeListNode.getNodeName() == "sequence") {
                    Element sequenceElement = (Element)entryNodeListNode;

                    proteinToUniprotMap.put("length", sequenceElement.getAttribute("length"));
                    //log.info(entryNodeList.item(i).getTextContent());
                    proteinToUniprotMap.put("sequence", entryNodeList.item(i).getTextContent().replace("\n", ""));
                }



            }
            proteinToUniprotMap.put("gene_id", proteinToGeneList);
        }


        return proteinToUniprotMap;

    }

//    public static Map<String, Object> parse(JSONObject json , Map<String,Object> out) throws JSONException{
//        Iterator<String> keys = json.keys();
//        while(keys.hasNext()){
//            String key = keys.next();
//            String val = null;
//            try{
//                JSONObject value = json.getJSONObject(key);
//                parse(value,out);
//            }catch(Exception e){
//                val = json.getString(key);
//            }
//
//            if(val != null){
//                out.put(key,val);
//            }
//        }
//        return out;
//    }


}
