# 📘 Manual de Usuario: Smart Manufacturing Cost Analyzer

Bienvenido al manual de usuario del **Smart Manufacturing Cost Analyzer**. Esta aplicación está diseñada para ayudarte a cargar, procesar y analizar los costos de producción y las eficiencias o mermas de manufactura de tu organización.

---

## 🏢 1. Gestión de Empresas (Cambio de Entidad)
La aplicación soporta la gestión de múltiples empresas (razones sociales) o sucursales, permitiéndote mantener el historial y los análisis contables completamente aislados.

### ¿Cómo cambiar de empresa o crear una nueva?
1. En la aplicación, busca la sección dedicada al control de la **Empresa Activa** (normalmente ubicada en la navegación lateral o panel de configuración).
2. **Para cambiar de empresa:** Abre el selector ("dropdown") y elige la empresa sobre la que deseas trabajar. La interfaz se actualizará instantáneamente para reflejar únicamente la información de la entidad elegida.
3. **Para añadir una nueva empresa:** Utiliza la opción de "Nueva Compañía" / "Añadir Empresa", define el nombre y se generará un entorno limpio (sin meses de historial previos) listo para empezar a cargar información financiera correspondiente a esa nueva razón social.

---

## 📈 2. Pantalla Principal y Carga de Datos Mensuales

### Seleccionando el Período
1. En la pantalla inicial o pestaña de importación, verás la opción temporal **Selecciona el Periodo**.
2. Escoge el **Año** (ej. 2026) y el **Mes** (ej. Marzo) que deseas procesar y analizar.
3. **Control de Duplicados (Bloqueo):** Si el mes ya había sido cargado previamente para tu empresa actual, el sistema inteligentemente lo marcará como "Bloqueado" y verás el mensaje *(Ya Cargado)*. Para volver a procesarlo, deberás limpiar primero el registro desde el Historial.
4. Si el mes está disponible, se habilitará el área de carga en color azul. Haz clic sobre ella o arrastra tu archivo `.xlsx` o `.xls`.

*Recomendación:* Puedes hacer uso del botón **“Descargar Plantilla de Ejemplo”** para asegurar que el formato de columnas (Materia Prima, SKU, Variación, etc.) es el esperado por el sistema.

---

## 🗂 3. Pantalla de Historial Mensual

La vista de **Historial (Historial Mensual)** funciona como la hemeroteca contable de tu organización. ¿Qué puedes hacer y ver aquí?

* **Línea de Tiempo de Análisis:** Listado cronológico visual que expone todos los meses que han sido procesados.
* **Métricas Inmediatas:** Cada mes de un vistazo te muestra si hubo un desempeño positivo o sobreejercicio de presupuesto, dándonte el Total del Costo Real vs Estándar de todo el mes entero.
* **Eliminación y Recarga:** En caso de que contabilidad haya modificado un archivo de costos después del cierre, puedes visitar esta pestaña, localizar el mes correspondiente y **Eliminarlo**. Esto desbloqueará el mes en la Pantalla Principal para subir el nuevo archivo validado.

---

## 🔍 4. Análisis Mensual Completo (Vista a Detalle)

Cuando seleccionas analizar profundamente los resultados de un mes (ya sea al término de cargar un archivo o abriendo un registro desde el historial), entrarás a la pantalla del **Análisis Completo**.

### A. Indicadores Financieros Globales (KPIs)
Te presentará tarjetas con resúmenes claros:
* **Costo Estándar (Total Std Cost):** El costo presupuestado acorde al estándar para ese volumen fabricado.
* **Costo Real (Total Real Cost):** Lo que te costó en verdad la producción.
* **Variación (Variance):** Si la variación es de naturaleza negativa o roja, indica un Sobrecosto o Pérdida. Si es positiva y verde, reporta un ahorro para la empresa.
* **Eficiencia Global:** Porcentaje total de cumplimiento coste vs expectativa. Mientras más cercano a 100%, mejor el control. Menor a 95% prende alertas de cuidado sobre los procesos de tu piso.

### B. Análisis Resumido con Inteligencia Artificial
Nuestros algoritmos precalculan el impacto global generando un Insights Inteligentes en automático:
* **Estado del Tablero Global:** Recibirás un mensaje textual directo informando si te encuentras en un "Estado de Eficiencia Crítica" o en "Desempeño Controlado".
* **Lupa de "Órdenes con Mayor Desviación":** En lugar de buscar orden por orden, la herramienta detecta inmediatamente e imprime un TOP 3 de tus peores órdenes, revelándote la cantidad de piezas, de sobrecostos en MXN y su eficiencia, simplificando la investigación de las fallas más garrafales.
* **Patrón de Frecuencia:** El sistema identifica qué porcentaje total de tus órdenes en ese mes cayeron en sobrecosto, para sugerir si el problema es puntual e incidental, o generalizado a través de toda tu planta.

### C. Desglose Avanzado por SKU
Por último, el núcleo del "Cost Analyzer". Dispondrás de una tabla extensiva ordenada según su fatalidad financiera, para cada SKU producido podrás revisar:
* **Cantidades:** Total Planeado y Unidades Finales Fabricadas.
* **Costeo Individualizado:** Costo Real total y Estándar total absorbido por el producto en particular.
* **Eficiencia del Producto:** Calcula de forma unitaria la eficiencia durante el proceso.
* **Porcentaje de Merma (%):** Revela rápidamente cuánto producto y valor económico se perdió por ineficiencias, agrupando al principio de la matriz todos los SKUs críticos en números de desviación en rojo. No pierdas tiempo con tus ítems bien portados (en verde) y enfoca el esfuerzo en la mejora de estos delatores.

---
*Última actualización de la versión Cloud | Smart Manufacturing Cost Analyzer*
