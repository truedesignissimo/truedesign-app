# Archivio PC — censimento prestazionale

## Obiettivo

Attribuire a ogni computer un voto prestazionale da 0 a 100 coerente con il suo impiego, distinguendo chiaramente potenza hardware, adeguatezza al ruolo, attendibilità dei dati e priorità di sostituzione.

## Profili provvisori

- **Ufficio**: Commerciale, Logistica, Amministrazione, Produzione, notebook generici, Ex Notebook Cristina ed Ex Notebook Gaia.
- **Grafica**: Stefano Baldin e Dario Breggiè.
- **Render**: Luca Bonfanti, Luca Favato, Walter Masetto, Alessandra Merrina, Martina Carraro e Beatrice B.
- **Tecnico**: i restanti computer dell'Ufficio Tecnico.

Le assegnazioni sono provvisorie e dovranno restare esplicite nei dati, così potranno essere corrette senza modificare l'algoritmo.

## Componenti misurate

Tutti i profili partono dalle stesse cinque misure normalizzate su scala 0–100:

1. CPU single-core, per reattività e operazioni poco parallelizzate;
2. CPU multi-core, per calcolo sostenuto e rendering CPU;
3. GPU, per grafica 3D e rendering accelerato;
4. RAM, come capacità disponibile;
5. archiviazione, considerando tecnologia e spazio libero quando noti.

La memoria grafica è un sesto indicatore per Grafica e Render. Sui Mac Apple Silicon viene considerata la memoria unificata, evitando di trattare la GPU integrata come una comune GPU Intel da ufficio.

I benchmark di CPU e GPU sono valori di riferimento associati al modello hardware. Quando il modello non è identificato, il componente non viene stimato dalla sola quantità di memoria.

### Normalizzazione

I valori di benchmark vengono salvati in una tabella versionata con data di rilevazione 29/10/2026 e trasformati in sottopunteggi stabili:

- CPU single-core: scala lineare, 0 a 1.500 punti e 100 a 5.000 punti;
- CPU multi-core: scala lineare, 0 a 5.000 punti e 100 a 50.000 punti;
- GPU: scala logaritmica, 0 sotto 500 G3D Mark e 100 a 25.000 punti;
- RAM: curva a soglie, 4 GB = 10, 8 GB = 35, 16 GB = 60, 32 GB = 80, 48 GB = 90, 64 GB o più = 100;
- memoria grafica: 2 GB = 20, 4 GB = 50, 8 GB = 80, 12 GB = 90, 16 GB o più = 100;
- archiviazione: HDD = 25, SSD con almeno 20% libero = 75, NVMe con almeno 20% libero = 90; meno del 20% libero sottrae 25 punti e meno del 10% libero sottrae 50 punti.

Fra due soglie RAM o VRAM si usa interpolazione lineare. Tutti i risultati vengono limitati fra 0 e 100. Per Apple Silicon il benchmark GPU viene associato al chip completo e la memoria unificata usa la stessa curva della RAM.

## Pesi per profilo

| Profilo | Single-core | Multi-core | GPU | RAM | SSD | VRAM / memoria unificata |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Ufficio | 40% | 15% | 5% | 25% | 15% | — |
| Tecnico | 35% | 25% | 15% | 20% | 5% | — |
| Grafica | 20% | 15% | 25% | 25% | 5% | 10% |
| Render | 10% | 30% | 30% | 15% | 5% | 10% |

Il voto usa una media geometrica pesata, così un collo di bottiglia riduce il risultato più di quanto accadrebbe con una media aritmetica.

## Dati mancanti e attendibilità

- Un componente sconosciuto viene escluso dal calcolo e i pesi noti vengono rinormalizzati.
- Il voto non viene abbassato solo perché manca un dato.
- L'attendibilità è **Alta** quando è noto almeno il 90% del peso del profilo, **Media** dal 70% all'89% e **Bassa** sotto il 70%.
- I voti con attendibilità Media o Bassa sono marcati come **provvisori**.
- Il dettaglio del PC elenca i dati che servono per completare il censimento.

## Fasce

- **85–100 · Eccellente**
- **70–84 · Forte**
- **55–69 · Adeguato**
- **40–54 · Limitato**
- **0–39 · Insufficiente**

## Indicazione operativa

- **Mantieni**: voto almeno 55 e sistema operativo supportato.
- **Programma sostituzione**: voto da 40 a 54 nel profilo assegnato.
- **Pensiona prima**: voto inferiore a 40 oppure sistema operativo esplicitamente fuori supporto.
- **Ricolloca in Ufficio**: voto inferiore a 55 nel profilo assegnato ma almeno 55 nel profilo Ufficio.
- L'indicazione è provvisoria quando l'attendibilità del voto è Bassa.

Lo stato del sistema operativo resta separato dalla performance: può aumentare la priorità di sostituzione, ma non altera il voto hardware.

## Interfaccia

Ogni scheda mostra profilo, voto, fascia e attendibilità. Il dettaglio mostra:

- i sottopunteggi disponibili;
- il voto nei quattro profili, utile per valutare una ricollocazione;
- l'indicazione operativa;
- i dati mancanti da reperire.

I controlli permettono di filtrare per profilo e ordinare per performance crescente, così i computer da valutare per primi emergono immediatamente. La modalità resta pubblica e di sola lettura.

## Nuovi computer confermati

### Ex Notebook Cristina

- HP ProBook 455 15.6 G10, nome dispositivo `NbCristinaC`;
- AMD Ryzen 5 7530U, 16 GB RAM, AMD Radeon Graphics integrata;
- archiviazione 477 GB con 157 GB usati;
- Windows 11 Pro 25H2 build 26200.9457, installato il 05/12/2025;
- seriale e area non disponibili;
- profilo provvisorio: Ufficio.

### Ex Notebook Gaia

- HP EliteBook 630 13.3 G10, nome dispositivo `NbGaiaB`;
- Intel Core i5-1335U, 8 GB RAM, Intel UHD Graphics integrata;
- archiviazione 238 GB con 220 GB usati;
- Windows 11 Pro 25H2 build 26200.9457, installato il 18/02/2025;
- seriale `5CD337LZ66`, area non disponibile;
- profilo provvisorio: Ufficio.

Lo spazio quasi esaurito di Ex Notebook Gaia viene segnalato come criticità di archiviazione e influenza il sottopunteggio SSD.

## Vincoli

- Nessuna nuova libreria UI.
- Nessuna modifica allo schema Supabase.
- Tutto il codice e i dati restano in `src/app/apps/archivio-pc/`.
- Il calcolo deve essere puro, deterministico e coperto da test.
- Nessun dato hardware mancante viene inventato.
