create database PuntoDeVenta;
go

use PuntoDeVenta;
go

/*
	Tabla de Usuario
	Guadar informacion y Roles de (Admin o Cliente)
*/
create table Usuarios (
	IdUsuario int identity(1,1) primary key,
	Username varchar(50) not null unique,
	Password varchar(255) not null,
	Role varchar(10) not null Check (Role In ('Admin', 'Cliente')),
	Creado datetime default Getdate()
);
go

/*
	Tabla de Productos
	Guarda informacion de Productos y Stock
*/
create table Productos (
	IdProducto int identity(1,1) primary key,
	Nombre varchar(100) not null,
	Categoria varchar(50),
	Precio decimal(10,2) not null,
	Stock int not null default 0,
	Creado datetime default getdate()
);
go

/*
	Tabla Ventas
*/
create table Ventas (
	IdVenta int identity(1,1) primary key,
	IdUsuario int not null,
	FechaVenta datetime default getdate(),
	Total decimal(10,2) not null,
	Foreign Key (IdUsuario) References Usuarios(IdUsuario)
);
go

/*
	Record de Transacioned de los ventas
*/
create table DetallesVentas (
	IdDetalle int identity(1,1) primary key,
	IdVenta int not null,
	IdProducto int not null,
	Cantidad int not null,
	PrecioUnidad decimal(10,2) not null,
	TotalParcial as (Cantidad * PrecioUnidad) persisted,
	Foreign Key (IdVenta) References Ventas(IdVenta),
	Foreign Key (IdProducto) References Productos(IdProducto)
);
go

/*
 Las Tablas para los triggers
*/
create table Auditoria_Productos(
	IdAuditoria int identity(1,1) primary key,
	Operacion varchar(10) not null, --Insert, Update, Delete
	IdProducto int,
	NombreProducto varchar(100),
	PrecioViejo decimal(10,2),
	PrecioNuevo decimal(10,2),
	StockViejo int,
	StockNuevo int,
	CambiadoPor varchar(100),
	Cambiado datetime default getdate(),
	Description varchar(255)
);
go

create table Auditoria_Ventas (
	IdAuditoria int identity(1,1) Primary Key,
	Operacion varchar(10) not null,
	IdVenta int,
	IdUsuario int,
	Total decimal(10,2),
	CambiadoPor varchar(100),
	Description varchar(255)
);
go

ALTER TABLE Auditoria_Ventas
ADD Cambiado datetime default getdate();

-------------------------------------------------------------------
-------------------------------------------------------------------
/*Creacion de Usuarios y Roles*/
create login AdminLogin with Password = 'Admin123!', Check_Policy = off;
go

create login ClienteLogin with Password = 'Cliente123!', Check_Policy = off;
go

create user AdminUser for Login AdminLogin;
go

create user ClienteUser for Login ClienteLogin;
go

Alter Role db_datareader add member AdminUser;
Alter Role db_datawriter add member AdminUser;
go

Grant Execute To AdminUser;
Grant Alter To AdminUser;
go

Alter Role db_datareader add member ClienteUser;
go

Grant Insert on Ventas to ClienteUser;
Grant Insert on DetallesVentas to ClienteUser;
go

Grant Update on Productos to ClienteUser;
go

---------------------------------------------------------------------
---------------------------------------------------------------------
/*Triggers*/

--1.
create Trigger trg_Productos_Insert
ON Productos after Insert
AS
	DECLARE @idProducto int, @nombre varchar(100), 
	@precio Decimal(10,2), @stock int

	Select @idProducto = IdProducto, @nombre = Nombre,
			@precio = Precio, @stock = Stock
	From inserted

	Begin Transaction registraInsert
		Set Transaction Isolation Level READ COMMITTED
		Insert into Auditoria_Productos (
			Operacion, IdProducto, NombreProducto,
			PrecioNuevo, StockNuevo, CambiadoPor, Description
		)
		Values (
			'INSERT', @idProducto, @nombre,
			@precio, @stock, SYSTEM_USER,
			'Producto creado: ' + @nombre
		)
		COMMIT TRANSACTION registraInsert
		Print 'Producto registrado en auditoria: ' + @nombre
GO

--2.
create Trigger trg_Productos_Update
ON Productos after Update
AS
	Declare @idProducto INT, @nombre VARCHAR(100)
	Declare @precioViejo DECIMAL(10,2), @precioNuevo DECIMAL(10,2)
	Declare @stockViejo INT, @stockNuevo INT

	Select @idProducto = i.IdProducto, @nombre = i.Nombre,
		   @precioViejo = d.Precio, @precioNuevo = i.Precio,
		   @stockViejo = d.Stock, @stockNuevo = i.Stock
	From inserted i
	Inner join deleted d ON i.IdProducto = d.IdProducto

	Begin Transaction registraUpdate
		Set Transaction Isolation Level READ COMMITTED
		INSERT into Auditoria_Productos (
			Operacion, IdProducto, NombreProducto,
			PrecioViejo, PrecioNuevo,
			StockViejo, StockNuevo,
			CambiadoPor, Description
		)
		Values (
			'UPDATE', @idProducto, @nombre,
			@precioViejo, @precioNuevo,
			@stockViejo, @stockNuevo,
			SYSTEM_USER,
			'Producto actualizado: ' + @nombre
		)
		COMMIT TRANSACTION registraUpdate
		Print 'Actualizacion registrada en auditoria: ' + @nombre
GO

--3.
create Trigger trg_Productos_Delete
ON Productos after Delete
AS
	Declare @idProducto INT, @nombre VARCHAR(100)
	Declare @precio DECIMAL(10,2), @stock INT

	Select @idProducto = IdProducto, @nombre = Nombre,
		   @precio = Precio, @stock = Stock
	From deleted

	Begin Transaction registraDelete
		Set Transaction Isolation Level READ COMMITTED
		INSERT into Auditoria_Productos (
			Operacion, IdProducto, NombreProducto,
			PrecioViejo, StockViejo,
			CambiadoPor, Description
		)
		Values (
			'DELETE', @idProducto, @nombre,
			@precio, @stock,
			SYSTEM_USER,
			'Producto eliminado: ' + @nombre
		)
		COMMIT TRANSACTION registraDelete
		Print 'Eliminacion registrada en auditoria: ' + @nombre
GO

--4.
create Trigger trg_Ventas_Insert
ON Ventas after INSERT
AS
	Declare @idVenta INT, @idUsuario INT, @total DECIMAL(10,2)

	Select @idVenta = IdVenta, @idUsuario = IdUsuario, @total = Total
	From inserted

	Begin Transaction registraVenta
		Set Transaction Isolation Level READ COMMITTED
		INSERT into Auditoria_Ventas (
			Operacion, IdVenta, IdUsuario,
			Total, CambiadoPor, Description
		)
		Values (
			'INSERT', @idVenta, @idUsuario,
			@total, SYSTEM_USER,
			'Venta realizada por usuario: ' + CAST(@idUsuario AS VARCHAR)
		)
		COMMIT TRANSACTION registraVenta
		Print 'Venta registrada en auditoria. IdVenta: ' + CAST(@idVenta AS VARCHAR)
GO

--5.
create Trigger trg_DetallesVentas_Insert
ON DetallesVentas after INSERT
AS
	Declare @idProducto INT, @cantidad INT
	Declare @totalStock INT

	Select @idProducto = IdProducto, @cantidad = Cantidad
	From inserted
	Begin Transaction disminuyeStock
		Set Transaction Isolation Level SERIALIZABLE

		Select @totalStock = Stock - @cantidad
		From Productos
		where IdProducto = @idProducto

		If Exists (Select 1 from Productos where IdProducto = @idProducto)
			If (@totalStock >= 0)
				Begin
					Update Productos
					Set Stock = Stock - @cantidad
					Where IdProducto = @idProducto

					INSERT into Auditoria_Productos (
						Operacion, IdProducto, NombreProducto,
						StockViejo, StockNuevo,
						CambiadoPor, Description
					)
					Select
						'UPDATE', p.IdProducto, p.Nombre,
						p.Stock + @cantidad, p.Stock,
						SYSTEM_USER,
						'Stock reducido por venta. Cantidad vendida: ' + CAST(@cantidad AS VARCHAR)
					from Productos p
					where p.IdProducto = @idProducto

					COMMIT TRANSACTION disminuyeStock
					Print 'Transaccion Realizada. Stock actualizado.'
				end
			else
				Begin
					Print 'No hay stock suficiente para este pedido. Stock disponible: ' 
						+ CONVERT(NVARCHAR(50), @totalStock + @cantidad)
					ROLLBACK TRANSACTION disminuyeStock
				end
		else
			Begin
				Print 'No existe el producto con ID: ' + CONVERT(NVARCHAR(50), @idProducto)
			end
GO

-----------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------

-- Add a test user
INSERT INTO Usuarios (Username, Password, Role)
VALUES ('testadmin', '1234', 'Admin');
GO

-- Add a test product with 10 stock
INSERT INTO Productos (Nombre, Categoria, Precio, Stock)
VALUES ('Coca Cola', 'Bebidas', 18.50, 10);
GO

SELECT * FROM Auditoria_Productos;

-- Simulate a sale
INSERT INTO Ventas (IdUsuario, Total)
VALUES (1, 37.00);
GO

-- Add sale detail (this should trigger stock reduction)
INSERT INTO DetallesVentas (IdVenta, IdProducto, Cantidad, PrecioUnidad)
VALUES (1, 1, 2, 18.50);
GO

-- Stock should now be 8
SELECT * FROM Productos;

-- Should show the stock reduction record
SELECT * FROM Auditoria_Productos;

-- Should show the sale record
SELECT * FROM Auditoria_Ventas;