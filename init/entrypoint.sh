#!/bin/bash
echo "Esperando que SQL Server este listo..."

until /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Tecnm123!" -No -Q "SELECT 1" &> /dev/null
do
  echo "SQL Server no esta listo todavia, esperando 5 segundos..."
  sleep 5
done

echo "SQL Server listo! Ejecutando script..."

/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Tecnm123!" -No -i /var/opt/mssql/temp/PuntoDeVentaTBD.sql

echo "Script ejecutado correctamente!"