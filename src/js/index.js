import "../style.css";
import "simple-datatables/dist/style.css";
import { DataTable } from "simple-datatables";
import { getSalesCoffee } from "./requirements.js";

const statusMessage = document.querySelector("#status-message");
const salesTable = document.querySelector("#sales-table");

const escapeHTML = (value) => {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

const splitCSVLine = (line) => {
    const values = [];
    let currentValue = "";
    let insideQuotes = false;

    for (const character of line) {
        if (character === '"') {
            insideQuotes = !insideQuotes;
        } else if (character === "," && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = "";
        } else {
            currentValue += character;
        }
    }

    values.push(currentValue.trim());
    return values;
};

const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);

    const headers = splitCSVLine(lines[0]);

    return lines.slice(1).map((line) => {
        const values = splitCSVLine(line);
        const row = {};

        headers.forEach((header, index) => {
            row[header] = values[index] ?? "";
        });

        return row;
    });
};
const parseXML = (text) => {
    const parser = new DOMParser();
    const xmlDocument = parser.parseFromString(text, "application/xml");

    const parserError = xmlDocument.querySelector("parsererror");

    if (parserError) {
        throw new Error("La respuesta XML no se pudo procesar correctamente.");
    }

    const rows = Array.from(xmlDocument.querySelectorAll("row"));

    return rows.map((row) => {
        const sale = {};

        Array.from(row.children).forEach((child) => {
            sale[child.tagName] = child.textContent.trim();
        });

        return sale;
    });
};
const parseResponse = (responseText) => {
    const cleanedResponse = responseText.trim();

    if (cleanedResponse.startsWith("<")) {
        return parseXML(cleanedResponse);
    }

    try {
        const json = JSON.parse(cleanedResponse);

        if (Array.isArray(json)) {
            return json;
        }

        if (Array.isArray(json.data)) {
            return json.data;
        }

        return [json];
    } catch {
        return parseCSV(cleanedResponse);
    }
};

const renderDatatable = (sales) => {
    if (!sales.length) {
        salesTable.innerHTML = `
      <thead>
        <tr>
          <th>Mensaje</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>No existen datos para mostrar.</td>
        </tr>
      </tbody>
    `;
        return;
    }

    const columns = Object.keys(sales[0]);

    const thead = `
    <thead>
      <tr>
        ${columns.map((column) => `<th>${escapeHTML(column)}</th>`).join("")}
      </tr>
    </thead>
  `;

    const tbody = `
    <tbody>
      ${sales
            .map((sale) => {
                return `
            <tr>
              ${columns
                        .map((column) => `<td>${escapeHTML(sale[column])}</td>`)
                        .join("")}
            </tr>
          `;
            })
            .join("")}
    </tbody>
  `;

    salesTable.innerHTML = thead + tbody;

    new DataTable(salesTable, {
        searchable: true,
        sortable: true,
        perPage: 10,
        perPageSelect: [5, 10, 15, 20],
        labels: {
            placeholder: "Buscar...",
            searchTitle: "Buscar en la tabla",
            perPage: "registros por página",
            noRows: "No hay registros",
            info: "Mostrando {start} a {end} de {rows} registros",
        },
    });
};

export const processSalesCoffee = async () => {
    try {
        statusMessage.textContent = "Cargando datos de Coffee Sales...";

        const response = await getSalesCoffee();
        const sales = parseResponse(response);

        renderDatatable(sales);

        statusMessage.textContent = "Datos cargados correctamente.";
    } catch (error) {
        console.error(error);

        statusMessage.textContent =
            "Ocurrió un error al cargar los datos de Coffee Sales.";

        salesTable.innerHTML = `
      <thead>
        <tr>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHTML(error.message)}</td>
        </tr>
      </tbody>
    `;
    }
};

document.addEventListener("DOMContentLoaded", processSalesCoffee);