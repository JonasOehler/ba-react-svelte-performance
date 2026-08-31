import { writeSummaryCSV } from "../helpers/results";

writeSummaryCSV(new Date().toISOString().slice(0, 10));
