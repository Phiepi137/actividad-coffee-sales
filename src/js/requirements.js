const COFFEE_SALES_URL = "https://raw.githubusercontent.com/DATA-DAWM/Datos/refs/heads/main/Coffee/Coffe_sales.xml";

export const getSalesCoffee = () => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("GET", COFFEE_SALES_URL, true);

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.responseText);
      } else {
        reject(new Error(`Error HTTP: ${request.status}`));
      }
    };

    request.onerror = () => {
      reject(new Error("No se pudo realizar el requerimiento asíncrono."));
    };

    request.send();
  });
};