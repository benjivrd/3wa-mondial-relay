import axios from "axios";
import xml2js from "xml2js";
import { RelaySearchType } from "../type/RelaySearchType";
import { ObjectToString, createHash } from "../utils/helper";
import { isValideSearchRelayData , isValideCreateTicket} from "../utils/validation";
import express from "express";
import {
  formatePointRelay,
  getTemplateDataXml,
} from "../utils/pointRelayFormat";

export async function searchPointRelay(
  req: express.Request,
  res: express.Response
) {
  const { pays, codePostal, limitResult } = req.body;
  const { ENSEIGN, KEY_PRIVATE } = process.env;

  const isValid = isValideSearchRelayData({ pays, codePostal, limitResult });

  if (!isValid.status) {
    res.status(400).send({ messages: isValid.messages });
    return;
  }

  const relay: RelaySearchType = {
    enseign: ENSEIGN,
    pays,
    codePostal,
    limitResult,
    kPrivate: KEY_PRIVATE,
  };

  const concatenateValues: string = ObjectToString(relay);
  const hash: string = createHash(concatenateValues);

  try {
    const url: string = "https://api.mondialrelay.com/Web_Services.asmx";
    const action: string =
      "http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche";
    const data: string = getTemplateDataXml(relay, hash);

    const config: object = {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: action,
      },
    };

    const response = await axios.post(url, data, config);

    const xmlResponse = response.data;
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsedResponse = await parser.parseStringPromise(xmlResponse);

    const pointsRelay: Object =
      parsedResponse["soap:Envelope"]["soap:Body"][
        "WSI4_PointRelais_RechercheResponse"
      ]["WSI4_PointRelais_RechercheResult"]["PointsRelais"][
        "PointRelais_Details"
      ];

    const formatedPointRelay = formatePointRelay(pointsRelay);

    res.send(formatedPointRelay);
  } catch (error) {
    res.status(500).send("Erreur lors de la recherche de points relay");
  }
}

export async function createTicketRelay(
  req: express.Request,
  res: express.Response
) {
  const { modeCol,modeLiv,expeLangage,expeAd1,expeAd3,expeVille,expeCP,expePays,destLangage,destAd1,destAd3,destVille,destCp,destPays,poids,nbColis } = req.body;
  const { ENSEIGN, KEY_PRIVATE } = process.env;

  
  const isValid = isValideCreateTicket({modeCol,modeLiv,expeLangage,expeAd1,expeAd3,expeVille,expeCP,expePays,destLangage,destAd1,destAd3,destVille,destCp,destPays,poids,nbColis});

  if (!isValid.status) {
    res.status(400).send({ messages: isValid.messages });
    return;
  }

}
