# Sistema de Seguimiento de Compras

Aplicación web para el seguimiento de órdenes de compra de equipos y servicios.

## Requisitos

- Un navegador web moderno (Chrome, Firefox, Edge, Safari)
- No requiere instalación ni servidor

## Instrucciones

1. Abre el archivo `index.html` en tu navegador (doble clic)
2. Los datos se guardan automáticamente en tu navegador
3. Puedes cerrar y abrir la aplicación sin perder datos

## Funcionalidades

- **Dashboard**: Resumen con estadísticas y próximas entregas
- **Crear orden**: Formulario completo para registrar nuevas órdenes
- **Ver órdenes**: Tabla con búsqueda, filtros y ordenamiento
- **Editar orden**: Modal para modificar datos existentes
- **Eliminar orden**: Confirmación antes de borrar
- **Exportar CSV**: Descargar datos en formato Excel
- **Exportar JSON**: Copia de seguridad completa
- **Importar JSON**: Restaurar desde copia de seguridad

## Campos de la base de datos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Fecha de orden | Date | Cuándo se creó la orden |
| Número de orden | Text | Código único de la orden |
| Descripción | Text | Detalle del equipo/servicio |
| Proveedor | Text | Empresa proveedora |
| Proyecto | Text | Proyecto destino |
| Fecha esperada | Date | Fecha estimada de llegada |
| Tiempo fabricación | Text | Duración de fabricación |
| Transporte | Select | Marítimo, Aéreo o Terrestre |
| Estado | Select | Pendiente, En fabricación, En tránsito, Entregado, Cancelado |
| Costo | Number | Presupuesto |
| Responsable | Text | Persona encargada |
| Fecha entrega real | Date | Fecha efectiva de entrega |
| Notas | Text | Observaciones |

## Notas Importantes

- Los datos se guardan en el navegador (localStorage)
- Si limpias el historial del navegador, perderás los datos
- Usa la función "Exportar JSON" para crear copias de seguridad
- La función "Importar JSON" permite restaurar datos desde un backup
