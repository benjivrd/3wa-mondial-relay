import express from "express";
import axios from "axios";
import crypto from "crypto";
import { config } from 'dotenv'
import xml2js from "xml2js";
import { RelaySearchType } from "./type/RelaySearchType";

const app = express();
const port = 3300;

config();

app.use(express.json());

app.post(
  "/recherche-point-relay",
  async (req: express.Request, res: express.Response) => {
    const {pays, codePostal, limitResult, ville} = req.body;
    const {ENSEIGN, KEY_PRIVATE} = process.env;

    const regexPaysIso: RegExp = /^[A-Za-z]{2}$/;
    const regexVille: RegExp = /^[A-Za-z_'-]{2,25}$/;

    if(pays === undefined || codePostal === undefined || limitResult === undefined) {
      res.status(400).send({message: "Les champs pays, code postal et la limite de resultats sont obligatoires"});
      return;
    }
    if(!regexPaysIso.test(pays)) {
      res.status(400).send({message: "Le pays envoyé n'est pas conforme"});
      return;
    }
    if(!regexVille.test(ville)) {
      res.status(400).send({message: "La ville envoyé n'est pas conforme"});
      return;
    }
    if(isNaN(limitResult) || limitResult > 30) {
      res.status(400).send({message: "Le nombre doit être inférieur à 30"});
      return;
    }
    if(isNaN(codePostal) || codePostal.length != 5) {
      res.status(400).send({message: "Le nombre doit être égale à 5"});
      return;
    }

    const relay: RelaySearchType = {enseign: ENSEIGN, pays, codePostal, ville: ville ? ville : null, limitResult, kPrivate: KEY_PRIVATE};

    const hash = crypto.createHash("md5");
    

    const concatenateValues = Object.values(relay).reduce((prev, next) => {
      if(next !== null) {
        return prev.toString() + next.toString();
      }
      return prev.toString();
    });

    console.log(concatenateValues);

    hash.update(concatenateValues as string);
    const finalHash = hash.digest("hex").toUpperCase();

    console.log(finalHash);

    try {
      const url = "https://api.mondialrelay.com/Web_Services.asmx";
      const action =
        "http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche";
      const data = `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <WSI4_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
            <Enseigne>${relay.enseign}</Enseigne>
            <Pays>${relay.pays}</Pays>
            <CP>${relay.codePostal}</CP>
            ${relay.ville && `<Ville>${relay.ville}</Ville>`}
            <NombreResultats>${relay.limitResult}</NombreResultats>
            <Security>${finalHash}</Security>
          </WSI4_PointRelais_Recherche>
        </soap:Body>
      </soap:Envelope>`;

      console.log(data);


      const config = {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: action,
        },
      };

      const response = await axios.post(url, data, config);

      console.log(response.data);

      const xmlResponse = response.data;
      const parser = new xml2js.Parser({ explicitArray: false });
      const parsedResponse = await parser.parseStringPromise(xmlResponse);

      const pointsRelay =
        parsedResponse["soap:Envelope"]["soap:Body"][
          "WSI4_PointRelais_RechercheResponse"
        ]["WSI4_PointRelais_RechercheResult"]["PointsRelais"];

      res.json(pointsRelay);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Erreur lors de la recherche de points relay");
    }
  }
);

app.listen(port, () => {
  console.log("Serveur en écoute sur le port " + port);
});
