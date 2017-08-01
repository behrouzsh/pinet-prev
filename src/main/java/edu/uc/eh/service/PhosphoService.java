package edu.uc.eh.service;

import edu.uc.eh.utils.UtilsIO;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static java.lang.Math.min;
import static java.lang.StrictMath.max;

/**
 * Created by behrouz on 1/25/17.
 */
@Service
public class PhosphoService {

    private static final Logger log = LoggerFactory.getLogger(PhosphoService.class);


    @Value("${resources.phosphoGenes2Kinase}")
    String phosphoGenes2KinaseInfo;

    @Value("${resources.phosphoGeneProbability}")
    String phosphoGeneProbabilityInfo;

    @Value("${urls.harmonizomeGene}")
    String harmonizomeGeneTemplate;

    @Value("${urls.harmonizomeProtein}")
    String harmonizomeProteinTemplate;

    @Value("${resources.blosum50Json}")
    String blosum50Info;

    @Value("${resources.phosphoAmino2KinaseSequence}")
    String phosphoAmino2KinaseSequenceInfo;

    @Autowired
    UniprotService uniprotService = new UniprotService();

    public JSONObject computePhosphoNetwork(String[] geneListAndOrganism) throws Exception {
        //The last input of geneListAndOrganism is the organism id
        int didx = 0; //definite idx
        int dbdx = 0; //definite blosum idx
        int iidx = 0; //indefinite idx
        int bidx = 0; //blosum idx
        String kinase;
        String gene;
        String inputGene;
        String inputGeneUpper;
        String gene2KinaseString;
        String kinase2GeneString;
        String geneName2KinaseNAmeString;
        String inside;
        String geneString;
        String aminoString;
        String siteString;
        String organismId = geneListAndOrganism[geneListAndOrganism.length - 1];//The organism id
        PCGService pcgService = new PCGService();




        ArrayList inutArray = new ArrayList();
        ArrayList inputGeneArray = new ArrayList();
        ArrayList phosphoAminoArray = new ArrayList();
        ArrayList phosphoSiteArray = new ArrayList();

        JSONObject newNode = new JSONObject();
        JSONObject newEdgeNode = new JSONObject();


        JSONObject phosphoGene2KinaseJson = new JSONObject();
        JSONObject phosphoGene2PrJson = new JSONObject();
        JSONObject phosphoAmino2KinaseSequenceJson = new JSONObject();
        JSONObject blosum50Json = new JSONObject();

        JSONObject network = new JSONObject();

        //definite is based on the kinase table
        JSONObject definite_nodeUnique = new JSONObject();
        JSONObject definite_Kinase_Gene_Network = new JSONObject();
        JSONArray definite_Kinase_Gene_NetworkNodes = new JSONArray();
        JSONArray definite_Kinase_Gene_NetworkEdges = new JSONArray();
        //definite blosum is based on the search over the peptides
        JSONObject definite_blosum_nodeUnique = new JSONObject();
        JSONObject definite_blosum_Kinase_Gene_Network = new JSONObject();
        JSONArray definite_blosum_Kinase_Gene_NetworkNodes = new JSONArray();
        JSONArray definite_blosum_Kinase_Gene_NetworkEdges = new JSONArray();
        //indefinite is based on the probability and blosum peptide
        JSONObject indefinite_nodeUnique = new JSONObject();
        JSONObject indefinite_Kinase_Gene_Network = new JSONObject();
        JSONArray indefinite_Kinase_Gene_NetworkNodes = new JSONArray();
        JSONArray indefinite_Kinase_Gene_NetworkEdges = new JSONArray();

        JSONObject blosum_nodeUnique = new JSONObject();
        JSONObject blosum_Kinase_Gene_Network = new JSONObject();
        JSONArray blosum_Kinase_Gene_NetworkNodes = new JSONArray();
        JSONArray blosum_Kinase_Gene_NetworkEdges = new JSONArray();

        JSONArray gene2KinaseList = new JSONArray();
        JSONArray kinase2GeneList = new JSONArray();
        JSONArray geneBlosumArray = new JSONArray();
        JSONObject geneBlosumJson = new JSONObject();
        JSONArray geneBlosumJsonArray = new JSONArray();
        log.info(geneListAndOrganism.toString());

        try {
            phosphoGene2PrJson = UtilsIO.getInstance().readJsonFile(phosphoGeneProbabilityInfo);
            //log.info(kinase2GeneJson.toString());

        } catch (Exception e) {
            String msg =  String.format("Error in obtaining phosphoGeneProbabilityInfo");
            log.warn(msg);
            throw new RuntimeException(msg);
        }

        try {
            phosphoGene2KinaseJson = UtilsIO.getInstance().readJsonFile(phosphoGenes2KinaseInfo);
            //log.info(phosphoGene2KinaseJson.toString());
        } catch (Exception e) {
            String msg =  String.format("Error in obtaining phosphoGenes2KinaseInfo");
            log.warn(msg);
            throw new RuntimeException(msg);
        }

        try {
            phosphoAmino2KinaseSequenceJson = UtilsIO.getInstance().readJsonFile(phosphoAmino2KinaseSequenceInfo);
            //log.info(phosphoAmino2KinaseSequenceJson.toString());
        } catch (Exception e) {
            String msg =  String.format("Error in obtaining phosphoAmino2KinaseSequenceInfo");
            log.warn(msg);
            throw new RuntimeException(msg);
        }

        try {
            blosum50Json = UtilsIO.getInstance().readJsonFile(blosum50Info);
            //log.info(blosum50Json.toString());
        } catch (Exception e) {
            String msg =  String.format("Error in obtaining blosum50Info");
            log.warn(msg);
            throw new RuntimeException(msg);
        }


        for (int i = 0; i < geneListAndOrganism.length - 1; i++) {

            inutArray.add(geneListAndOrganism[i]);

            log.info("inputgene");
            System.out.println(geneListAndOrganism[i]);

            inside = "";
            //geneString = "";
            aminoString = "";
            siteString = "";

            List<String> matchList = new ArrayList<String>();
            Pattern regex = Pattern.compile("\\[(.*?)\\]");
            geneString = geneListAndOrganism[i].replaceAll("\\[.*?\\] ?", "");
            //Pattern siteRegex = Pattern.compile("\\d+");
            //Pattern aminoRegex = Pattern.compile("[A-Z]{1}");

            Matcher insideMatcher = regex.matcher(geneListAndOrganism[i]);


            //log.info("here1");
            while(insideMatcher.find()) {
                System.out.println(insideMatcher.group(1));
                inside += insideMatcher.group(1).toString();
            }


            while(insideMatcher.find()) {
                System.out.println(insideMatcher.group(1));
                inside += insideMatcher.group(1).toString();
            }

            for(int iter = 0; iter < inside.length(); iter++){
                char w = inside.charAt(iter);
                if(Character.isUpperCase(inside.charAt(iter))){

                    aminoString += w;
                }
                if(Character.isDigit(inside.charAt(iter))){

                    siteString += w;
                }
            }


            //log.info("here4");
            phosphoAminoArray.add(aminoString);
            phosphoSiteArray.add(siteString);
            inputGeneArray.add(geneString);


        }

        //Get info about the genes
        String[] stringGeneArray = (String[]) inputGeneArray.toArray(new String[0]);
        ArrayList<Integer> geneProtenCheck = pcgService.checkGenes(stringGeneArray);
        JSONArray geneProteinInfo = pcgService.getTable(geneProtenCheck);
        //log.info(geneProteinInfo.toString());
        JSONObject geneSequenceInfo = new JSONObject();

        JSONArray phosphoGeneSequenceArray = new JSONArray();
        for (int i = 0; i < geneProteinInfo.size(); i++) {
            JSONObject phosphoGeneSequenceJson = new JSONObject();
            JSONArray uniprotId = (JSONArray)((JSONObject) geneProteinInfo.get(i)).get("uniprot_ids");

            //log.info("uniprot_ids");
            String uniprot_id = uniprotId.get(0).toString();
            //log.info(uniprot_id);
            String[] uniprot_idAndOrganism = {uniprot_id, organismId};

            geneSequenceInfo = uniprotService.getTable(uniprot_idAndOrganism);
            //log.info(geneSequenceInfo.toString());

            String cutSequence = cutSequenceMethod(geneSequenceInfo.get("sequence").toString(), Integer.parseInt((String) phosphoSiteArray.get(i)) );

            phosphoGeneSequenceJson.put("phosphoGene",geneListAndOrganism[i]);
            phosphoGeneSequenceJson.put("amino",phosphoAminoArray.get(i));
            phosphoGeneSequenceJson.put("site",phosphoSiteArray.get(i));
            phosphoGeneSequenceJson.put("sequence",cutSequence);
            log.info(phosphoGeneSequenceJson.toString());
            phosphoGeneSequenceArray.add(phosphoGeneSequenceJson);

        }
        //log.info("phosphoGeneSequenceArray");
        log.info(phosphoGeneSequenceArray.toString());
        //First only add the input genes
        for (int i = 0; i < geneListAndOrganism.length - 1; i++) {

            inputGene = geneListAndOrganism[i];
            inputGeneUpper = inputGene.toUpperCase();

            if (!indefinite_nodeUnique.containsKey(inputGeneUpper)) {

                newNode = generateNode(inputGene, "", iidx, 0);//tag 0 is for grey
                iidx = iidx + 1;
                indefinite_Kinase_Gene_NetworkNodes.add(newNode);
                indefinite_nodeUnique.put(inputGeneUpper, newNode);
            }

            if (!blosum_nodeUnique.containsKey(inputGeneUpper)) {

                newNode = generateNode(inputGene, "", bidx, 0);//tag 0 is for grey
                bidx = bidx + 1;
                blosum_Kinase_Gene_NetworkNodes.add(newNode);
                blosum_nodeUnique.put(inputGeneUpper, newNode);
            }

            //Add new node if not existed to nodeunique
            if (!definite_nodeUnique.containsKey(inputGeneUpper)) {
                newNode = generateNode(inputGene, "", didx, 0);//tag 0 is for grey
                didx = didx + 1;
                definite_Kinase_Gene_NetworkNodes.add(newNode);
                definite_nodeUnique.put(inputGeneUpper, newNode);
            }

            //Add new node if not existed to nodeunique
            if (!definite_blosum_nodeUnique.containsKey(inputGeneUpper)) {
                newNode = generateNode(inputGene, "", dbdx, 0);//tag 0 is for grey
                dbdx = dbdx + 1;
                definite_blosum_Kinase_Gene_NetworkNodes.add(newNode);
                definite_blosum_nodeUnique.put(inputGeneUpper, newNode);
            }
        }


        // Compute Network for the indefinite genes based on blosum50
        for (int i = 0; i < geneListAndOrganism.length - 1; i++) {
            //log.info("==========================================");
            //log.info("in computing indefinite");
            //log.info("inputgene");
            //log.info(input[i]);
            inputGene = geneListAndOrganism[i];
            inputGeneUpper = inputGene.toUpperCase();
            JSONObject phosphoGeneSequenceJson2 = (JSONObject) phosphoGeneSequenceArray.get(i);
            String phosphoAmino = phosphoGeneSequenceJson2.get("amino").toString();
            String phosphoSequence = phosphoGeneSequenceJson2.get("sequence").toString();
            String phosphoGene = phosphoGeneSequenceJson2.get("phosphoGene").toString();

            JSONObject phosphoKinaseSequence = (JSONObject) phosphoAmino2KinaseSequenceJson.get(phosphoAmino);

            //int iteration = 0;
            int blosumScoreHigh = -1000;
            int blosumScoreMax = -1000;
            JSONArray geneBlosumJsonArrayFinal = new JSONArray();
            //System.out.println (phosphoAmino + "  ++++++++++++++++++++++++++++++");


            for (Object key : phosphoKinaseSequence.keySet()) {
                //iteration ++;
                blosumScoreMax = computeBlosum50Score(blosum50Json, phosphoSequence, phosphoSequence);
                blosumScoreHigh = (int) ((double) blosumScoreMax / 2.0);
                //System.out.println ("Blosum high schore " + blosumScoreHigh);
                String keyStr = (String) key;
                //log.info("keyStr");
                //log.info(keyStr);
                Object keyvalue = phosphoKinaseSequence.get(keyStr);
                JSONArray keyvalueJsonArray = (JSONArray) keyvalue;
                geneBlosumJsonArrayFinal = new JSONArray();
                //Class cls = keyvalue.getClass();
                //System.out.println("The type of the object is: " + cls.getName());
                //Print key and value
                //System.out.println("key: " + keyStr);
                //System.out.println ("value: " + keyvalueJsonArray.get(0));
                //System.out.println ("value: " + keyvalueJsonArray);
                //System.out.println (keyStr + "  =========================================");

                int blosumScore;
                String blosumString = "";
                String blosumOrganism = "";
                for (int keyValueIter = 0; keyValueIter < keyvalueJsonArray.size(); keyValueIter++) {
                    geneBlosumJson = new JSONObject();
                    geneBlosumJsonArray = new JSONArray();
                    String kinaseSequence = (String) ((List) keyvalueJsonArray.get(keyValueIter)).get(1);
                    String organism = (String) ((List) keyvalueJsonArray.get(keyValueIter)).get(0);

                    blosumScore = computeBlosum50Score(blosum50Json, phosphoSequence, kinaseSequence.toUpperCase());
                    //if(phosphoSequence == kinaseSequence) {
                        //System.out.println("blosumScore " + blosumScore + " phosphoSequence " + phosphoSequence + " kinaseSequence " + kinaseSequence);
                    //}
                    if (blosumScore > blosumScoreHigh) {
                        System.out.println("here-1");
                        System.out.println("blosumScore " + blosumScore + " kinase " + keyStr + " kinaseSequence " + kinaseSequence);


                        blosumScoreHigh = blosumScore;
                        blosumString = kinaseSequence;
                        blosumOrganism = organism;
                        geneBlosumJson = new JSONObject();
                        geneBlosumJsonArray = new JSONArray();
                        geneBlosumJson.put("phosphoGene", phosphoGene);
                        geneBlosumJson.put("amino", phosphoAmino);
                        geneBlosumJson.put("geneSequence", phosphoSequence);
                        geneBlosumJson.put("kinase", keyStr);
                        geneBlosumJson.put("kinaseOrganism", blosumOrganism);
                        geneBlosumJson.put("kinasePeptide", blosumString);
                        geneBlosumJson.put("blosum50ScorePercent", Math.round(((double)blosumScoreHigh*100.0/(double)blosumScoreMax)));
                        geneBlosumJson.put("blosum50MaxScore", blosumScoreMax);
                        if (phosphoAmino.charAt(0) == phosphoSequence.charAt(7)) {
                            geneBlosumJson.put("valid", "valid");
                        } else {
                            geneBlosumJson.put("valid", "not valid");
                        }
                        geneBlosumJsonArray.add(geneBlosumJson);

                        log.info(geneBlosumJsonArray.toString());
                        System.out.println("==========================================");
                        geneBlosumJsonArrayFinal = geneBlosumJsonArray;
                    }
                    else if (blosumScore == blosumScoreHigh) {
                        System.out.println("here-2");
                        System.out.println("blosumScore " + blosumScore + " kinase " + keyStr + " kinaseSequence " + kinaseSequence);

                        blosumString = kinaseSequence;
                        blosumOrganism = organism;
                        geneBlosumJson = new JSONObject();
                        geneBlosumJson.put("phosphoGene", phosphoGene);
                        geneBlosumJson.put("amino", phosphoAmino);
                        geneBlosumJson.put("geneSequence", phosphoSequence);
                        geneBlosumJson.put("kinase", keyStr);
                        geneBlosumJson.put("kinaseOrganism", blosumOrganism);
                        geneBlosumJson.put("kinasePeptide", blosumString);
                        geneBlosumJson.put("blosum50ScorePercent", Math.round(((double)blosumScoreHigh/(double)blosumScoreMax)*100.0));
                        geneBlosumJson.put("blosum50MaxScore", blosumScoreMax);
                        if (phosphoAmino.charAt(0) == phosphoSequence.charAt(7)) {
                            geneBlosumJson.put("valid", "valid");
                        } else {
                            geneBlosumJson.put("valid", "not valid");
                        }
                        geneBlosumJsonArray.add(geneBlosumJson);
                        geneBlosumJsonArrayFinal = geneBlosumJsonArray;

                        log.info(geneBlosumJsonArray.toString());
                        System.out.println("==========================================");
                    }

                    //System.out.println ("organism: " + organism + " kinase: " + kinaseSequence);
                }

//                log.info("geneBlosumJsonArray");
//                log.info(geneBlosumJsonArrayFinal.toString());
                for (int blosumIter = 0; blosumIter < geneBlosumJsonArrayFinal.size(); blosumIter++) {
                    geneBlosumArray.add(geneBlosumJsonArrayFinal.get(blosumIter));

                    String kinaseKey = (String) ((JSONObject)geneBlosumJsonArrayFinal.get(blosumIter)).get("kinase");
                    Double blScore = ((Long) ((JSONObject)geneBlosumJsonArrayFinal.get(blosumIter)).get("blosum50ScorePercent")).doubleValue() ;

                    if (!blosum_nodeUnique.containsKey(kinaseKey)) {
                        newNode = generateNode(kinaseKey, "", bidx, 2);//tag 2 is for red nodes that phosphorylate the query genes
                        bidx = bidx + 1;

                        blosum_nodeUnique.put(kinaseKey, newNode);
                        blosum_Kinase_Gene_NetworkNodes.add(newNode);
                    }
                    newEdgeNode = generateEdgeNode((int) ((JSONObject) blosum_nodeUnique.get(kinaseKey)).get("idx"),
                            (int) ((JSONObject) blosum_nodeUnique.get(inputGeneUpper)).get("idx"), blScore, 1);
                    blosum_Kinase_Gene_NetworkEdges.add(newEdgeNode);

                    if(blScore == 100.0) {
                        //Add it to definite_blosum network
                        if (!definite_blosum_nodeUnique.containsKey(kinaseKey)) {
                            newNode = generateNode(kinaseKey, "", dbdx, 2);//tag 2 is for red nodes that phosphorylate the query genes
                            dbdx = dbdx + 1;

                            definite_blosum_nodeUnique.put(kinaseKey, newNode);
                            definite_blosum_Kinase_Gene_NetworkNodes.add(newNode);
                        }
                        newEdgeNode = generateEdgeNode((int) ((JSONObject) definite_blosum_nodeUnique.get(kinaseKey)).get("idx"),
                                (int) ((JSONObject) definite_blosum_nodeUnique.get(inputGeneUpper)).get("idx"), blScore, 1);
                        definite_blosum_Kinase_Gene_NetworkEdges.add(newEdgeNode);

                        //Add it to indefinite network
                        if (!indefinite_nodeUnique.containsKey(kinaseKey)) {
                            newNode = generateNode(kinaseKey, "", iidx, 2);//tag 2 is for red nodes that phosphorylate the query genes
                            iidx = iidx + 1;

                            indefinite_nodeUnique.put(kinaseKey, newNode);
                            indefinite_Kinase_Gene_NetworkNodes.add(newNode);
                        }
                        newEdgeNode = generateEdgeNode((int) ((JSONObject) indefinite_nodeUnique.get(kinaseKey)).get("idx"),
                                (int) ((JSONObject) indefinite_nodeUnique.get(inputGeneUpper)).get("idx"), blScore, 1);
                        indefinite_Kinase_Gene_NetworkEdges.add(newEdgeNode);


                    }
                }
            }
        }

        // Compute Network for the indefinite genes based on probability
        for (int i = 0; i < geneListAndOrganism.length - 1; i++) {
            //log.info("==========================================");
            //log.info("in computing indefinite");
            //log.info("inputgene");
            //log.info(input[i]);
            inputGene = geneListAndOrganism[i];
            inputGeneUpper = inputGene.toUpperCase();
            JSONObject phosphoGeneSequenceJson2 = (JSONObject) phosphoGeneSequenceArray.get(i);
            String phosphoAmino = phosphoGeneSequenceJson2.get("amino").toString();
            String phosphoSequence = phosphoGeneSequenceJson2.get("sequence").toString();
            String phosphoGene = phosphoGeneSequenceJson2.get("phosphoGene").toString();
            //log.info(phosphoAmino);
            //log.info(phosphoSequence);
            //log.info(phosphoGene);
            JSONObject phosphoProbability = (JSONObject) phosphoGene2PrJson.get(phosphoAmino);
            //log.info(String.valueOf(phosphoProbability.size()));

            //JSONObject jObject = new JSONObject(phosphoProbability);
            int iteration = 0;
            for (Object key : phosphoProbability.keySet()) {
                iteration ++;
                //log.info("---------------------------------");
                //log.info(String.valueOf(iteration));
                //based on you key types
                String keyStr = (String)key;
                Object keyvalue = phosphoProbability.get(keyStr);
                JSONArray keyvalueJsonArray = (JSONArray) keyvalue;
                Class cls = keyvalue.getClass();
                //System.out.println("The type of the object is: " + cls.getName());
                //Print key and value
                //System.out.println("key: " + keyStr);
                //System.out.println ("value: " + keyvalueJsonArray.get(0));

                //Compute probability
                double pr = computeProbability(keyvalueJsonArray, phosphoSequence);

                if (pr > 0.0){

                    if (!indefinite_nodeUnique.containsKey(keyStr)) {
                        //log.info(gene);


                        newNode = generateNode(keyStr, "", iidx, 2);//tag 2 is for red nodes that phosphorylate the query genes
                        iidx = iidx + 1;


                        indefinite_nodeUnique.put(keyStr, newNode);
                        indefinite_Kinase_Gene_NetworkNodes.add(newNode);
                    }
                    newEdgeNode = generateEdgeNode((int) ((JSONObject) indefinite_nodeUnique.get(keyStr)).get("idx"),
                            (int) ((JSONObject) indefinite_nodeUnique.get(inputGeneUpper)).get("idx"), pr, 2);
                    indefinite_Kinase_Gene_NetworkEdges.add(newEdgeNode);


                }

            }


        }


        // Compute Network for the definite genes
        for (int i = 0; i < geneListAndOrganism.length - 1; i++) {
            log.info("inputgene");
            System.out.println(geneListAndOrganism[i]);
            gene2KinaseList = new JSONArray();



            inputGene = geneListAndOrganism[i];
            inputGeneUpper = inputGene.toUpperCase();

            if (phosphoGene2KinaseJson.containsKey(inputGeneUpper)) {
                //log.info("gene2KinaseList");
                gene2KinaseList = (JSONArray) (phosphoGene2KinaseJson.get(inputGeneUpper));
                //log.info(gene2KinaseList.toString());
            }


            //Gene2Kinase ========================================
            //Gene2Kinase ========================================
            for (int j = 0; j < gene2KinaseList.size(); j++) {
                gene = (String) gene2KinaseList.get(j);
                //log.info("kinase");
                //log.info(gene);
                if (!definite_nodeUnique.containsKey(gene)) {
                    //log.info(gene);


                    newNode = generateNode(gene, "", didx, 2);//tag 2 is for red nodes that phosphorylate the query genes
                    didx = didx + 1;


                    definite_nodeUnique.put(gene, newNode);
                    definite_Kinase_Gene_NetworkNodes.add(newNode);
                }
                newEdgeNode = generateEdgeNode((int) ((JSONObject) definite_nodeUnique.get(gene)).get("idx"), (int) ((JSONObject) definite_nodeUnique.get(inputGeneUpper)).get("idx"), 100.0, 1);
                definite_Kinase_Gene_NetworkEdges.add(newEdgeNode);
            }
        }
        //==============================================






        indefinite_Kinase_Gene_Network.put("nodes", indefinite_Kinase_Gene_NetworkNodes);
        indefinite_Kinase_Gene_Network.put("edges", indefinite_Kinase_Gene_NetworkEdges);
        definite_Kinase_Gene_Network.put("nodes", definite_Kinase_Gene_NetworkNodes);
        definite_Kinase_Gene_Network.put("edges", definite_Kinase_Gene_NetworkEdges);
        definite_blosum_Kinase_Gene_Network.put("nodes", definite_blosum_Kinase_Gene_NetworkNodes);
        definite_blosum_Kinase_Gene_Network.put("edges", definite_blosum_Kinase_Gene_NetworkEdges);
        blosum_Kinase_Gene_Network.put("nodes", blosum_Kinase_Gene_NetworkNodes);
        blosum_Kinase_Gene_Network.put("edges", blosum_Kinase_Gene_NetworkEdges);
    //==============================================
        network.put("Blosum50_table", geneBlosumArray);
        network.put("Known_Kinase_TargetGene", definite_Kinase_Gene_Network);
        network.put("Known+Blosum50_Exact_Match_Kinase_TargetGene", definite_blosum_Kinase_Gene_Network);
        network.put("Known+Predicted_Probability_Kinase_TargetGene", indefinite_Kinase_Gene_Network);
        network.put("Known+Predicted_Blosum50_Kinase_TargetGene", blosum_Kinase_Gene_Network);

        log.info("phospho network");
        log.info(network.toString());
        return network;
    }

    int computeBlosum50Score(JSONObject blosum50, String geneSequence, String kinaseSequence){
        int score = 0;
        Object scoreObject;
        for(int iter = 0; iter < geneSequence.length(); iter++)
        {
            String kinaseStr = String.valueOf(kinaseSequence.charAt(iter));
            String geneStr = String.valueOf(geneSequence.charAt(iter));
            //log.info(blosum50.get(kinaseStr).toString());
            //log.info(((JSONObject)blosum50.get(kinaseStr)).get(geneStr).toString());
            score += ((Long) ((JSONObject)blosum50.get(kinaseStr)).get(geneStr)).intValue();
//            Class cls2 = scoreObject.getClass();
//            System.out.println("The type of the object is: " + cls2.getName());
        }
        return score;
    }


    double computeProbability(JSONArray keyvalue, String sequence){
        double pr = 0.0;
        double prob;
        JSONObject amino_acids_dic = new JSONObject();
        amino_acids_dic.put("A",0);
        amino_acids_dic.put("R",1);
        amino_acids_dic.put("N",2);
        amino_acids_dic.put("D",3);
        amino_acids_dic.put("C",4);
        amino_acids_dic.put("Q",5);
        amino_acids_dic.put("E",6);
        amino_acids_dic.put("G",7);
        amino_acids_dic.put("H",8);
        amino_acids_dic.put("I",9);
        amino_acids_dic.put("L",10);
        amino_acids_dic.put("K",11);
        amino_acids_dic.put("M",12);
        amino_acids_dic.put("F",13);
        amino_acids_dic.put("P",14);
        amino_acids_dic.put("S",15);
        amino_acids_dic.put("T",16);
        amino_acids_dic.put("W",17);
        amino_acids_dic.put("Y",18);
        amino_acids_dic.put("V",19);

        for(int i = 0; i < sequence.length(); i++){
            char ch = sequence.charAt(i);
            String key = String.valueOf(ch);

            //log.info(String.valueOf(key));
            if(!(ch == '_')){

                Object charDic = amino_acids_dic.get(key);


//                Class cls2 = charDic.getClass();
//                System.out.println("The type of the object is: " + cls2.getName());

                int charDickInt = (int) charDic;

                //log.info(String.valueOf(i*20 + charDickInt));
                if ((double) keyvalue.get(i*20 + charDickInt) == 0.0){
                    return 0.0;
                }
                else if ((double) keyvalue.get(i*20 + charDickInt) != 1.0){
                    //log.info(String.valueOf((double) keyvalue.get(i * 20 + charDickInt)));
                    //log.info(String.valueOf(Math.log((double) keyvalue.get(i * 20 + charDickInt))));
                    prob = (-1.0) / (Math.log((double) keyvalue.get(i * 20 + charDickInt)));
                    pr += prob;
                }
                else{
                    //In this situation the probability is 1 that we want to embold it!
                    pr += 10.0;
                }

            }
        }

        log.info(String.valueOf(pr));
        return pr;
    }


    String cutSequenceMethod(String sequence, int site){
        String cutSeq = new String();
        //log.info("in cutSequenceMEthod");
        //log.info(sequence);
        //log.info(String.valueOf(site));
        int start = max(0,site - 8);
        int stop = min(sequence.length(),site + 7);

        //log.info(String.valueOf(start));
        //log.info(String.valueOf(stop));
        cutSeq = sequence.substring(start,stop);

        if(site - 8 < 0){
            char[] repeat = new char[8 - site];
            char c = '_';
            Arrays.fill(repeat, c);
            cutSeq = new String(repeat) + cutSeq;
        }
        if(site + 7 > sequence.length()){
            char[] repeat2 = new char[site + 7 - sequence.length()];
            char c = '_';
            Arrays.fill(repeat2, c);
            cutSeq = cutSeq + new String(repeat2);
        }
        log.info(cutSeq);
        return cutSeq;
    }

    JSONObject generateEdgeNode(int sourceTag, int targetTag, double value, int tag)
    {
        JSONObject node = new JSONObject();
        node.put("source", sourceTag);
        node.put("target", targetTag);
        node.put("value", value);
        node.put("tag", tag);//tag 1 is for straight line, 2 for shadowed
        //node.put("value", 1);
        //node.put("weight", 1);
        return node;
    }





    JSONObject generateNode(String name, String id,int idx, int tag)//, float center, int value)
    {
        JSONObject node = new JSONObject();

        node.put("name", name);
        node.put("id", id);
        node.put("idx", idx);
        node.put("group", tag);


        node.put("weight",0);
        return node;
    }

//    JSONObject getGeneInfo(String url, String gene) throws Exception {
//
//        //String enrichrUrlGeneInfo = String.format(enrichrGeneInfo, gene);
//        String uri = String.format(url, gene);
//        String response;
//
//
//
//
//        RestTemplate restTemplate = new RestTemplate();
//        //String result = restTemplate.getForObject(uri, HarmonizomeGeneDomain.class);
//        System.out.println("******************");
//        System.out.println("******************");
//
//        System.out.println("++++++++++");
//
//        JSONObject geneInfoJson;
//        //HashMap geneMap;
//        Map geneMap;
//
//
//        try {
//
//            geneMap = UtilsNetwork.loadJSONFromStringHarmonizomeGene(result);
//
//
//
//
//
//                //System.out.println("uniprotMap:" + uniprotMap.toString());
//
////            response = UtilsNetwork.getInstance().readUrlXml(uri);
////            log.info(response);
////            JSONParser parser = new JSONParser();
////
////            geneInfoJson = (JSONObject) parser.parse(response);
////            System.out.println("--------------------");
////            JSONObject geneSymbol = (JSONObject) geneInfoJson.get("symbol");
////            System.out.println("===================");
////            System.out.println(geneInfoJson.toString());
////            System.out.println(geneSymbol.toString());
////
//        } catch (Exception e) {
//
//            String msg =  String.format("Error in obtaining geneInfo");
//            log.warn(msg);
//            throw new RuntimeException(msg);
//        }
//
//        geneInfoJson = new JSONObject(geneMap);
//
//        return geneInfoJson;
//    }

}

