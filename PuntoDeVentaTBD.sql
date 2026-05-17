If not exists (Select name from sys.databases where name = 'PuntoDeVenta')
Begin
    create database PuntoDeVenta;
end
Go

Use PuntoDeVenta;
Go

If not exists (Select * from sysobjects where name='Usuarios' and xtype='U')
create table Usuarios (
	IdUsuario int identity(1,1) primary key,
	Username varchar(50) not null unique,
	Password varchar(255) not null,
	Role varchar(10) not null Check (Role In ('Admin', 'Cliente')),
	Creado datetime default Getdate()
);
go

If not exists (Select * from sysobjects where name='Productos' and xtype='U')
create table Productos (
	IdProducto int identity(1,1) primary key,
	Nombre varchar(100) not null,
	Categoria varchar(50),
	Precio decimal(10,2) not null,
	Stock int not null default 0,
	Creado datetime default getdate()
);
go

If not exists (Select * from sysobjects where name='Ventas' and xtype='U')
create table Ventas (
	IdVenta int identity(1,1) primary key,
	IdUsuario int not null,
	FechaVenta datetime default getdate(),
	TotalVenta decimal(10,2) not null,
	FolioRecibo varchar(50) null,
	EstadoPago varchar(20) not null default 'PAGADO',
	MetodoPago varchar(20) not null default 'BILLETERA',
	Foreign Key (IdUsuario) References Usuarios(IdUsuario)
);
go

If not exists (Select * from sysobjects where name='DetallesVentas' and xtype='U')
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

if not exists (Select * from sysobjects where name='Auditoria_Productos' and xtype='U')
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

if not exists (Select * from sysobjects where name='Auditoria_Ventas' and xtype='U')
create table Auditoria_Ventas (
	IdAuditoria int identity(1,1) Primary Key,
	Operacion varchar(10) not null,
	IdVenta int,
	IdUsuario int,
	TotalVenta decimal(10,2),
	CambiadoPor varchar(100),
	Cambiado datetime default getdate(),
	FolioRecibo varchar(50) null,
	MetodoPago varchar(20) null,
	Description varchar(255)
);
go

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Auditoria_Usuarios' AND xtype='U')
CREATE TABLE Auditoria_Usuarios (
    IdAuditoria int identity(1,1) primary key,
    Operacion varchar(10) not null,
    IdUsuario int,
    UsernameViejo varchar(50),
    UsernameNuevo varchar(50),
    RoleViejo varchar(10),
    RoleNuevo varchar(10),
    PasswordCambiado bit,
    CambiadoPor varchar(100),
    Cambiado datetime default getdate(),
    Description varchar(255)
);
GO

-------------------------------------------------------------------
-------------------------------------------------------------------
/* Billeteras y Movimientos */

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Billeteras' AND xtype='U')
CREATE TABLE Billeteras (
    IdBilletera int identity(1,1) primary key,
    IdUsuario int not null unique,
    Saldo decimal(10,2) not null default 0,
    Creado datetime default getdate(),
    Foreign Key (IdUsuario) References Usuarios(IdUsuario)
);
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Movimientos_Billetera' AND xtype='U')
CREATE TABLE Movimientos_Billetera (
    IdMovimiento int identity(1,1) primary key,
    IdBilletera int not null,
    TipoMovimiento varchar(20) not null Check (TipoMovimiento in ('RECARGA', 'COMPRA', 'AJUSTE')),
    Monto decimal(10,2) not null,
    SaldoAnterior decimal(10,2),
    SaldoNuevo decimal(10,2),
    IdVenta int null,
    CambiadoPor varchar(100),
    FechaMovimiento datetime default getdate(),
    Description varchar(255),
    Foreign Key (IdBilletera) References Billeteras(IdBilletera),
    Foreign Key (IdVenta) References Ventas(IdVenta)
);
GO

-------------------------------------------------------------------
-------------------------------------------------------------------
/*Creacion de Usuarios y Roles*/
-- Logins
If not exists (Select name from sys.server_principals where name = 'AdminLogin')
	create login AdminLogin with Password = 'Admin123!', Check_Policy = off;
go

If not exists (Select name from sys.server_principals where name = 'ClienteLogin')
create login ClienteLogin with Password = 'Cliente123!', Check_Policy = off;
go

-- Users

If not exists (Select name from sys.database_principals where name = 'AdminUser')
	create user AdminUser for Login AdminLogin;
go

If not exists (Select name from sys.database_principals where name = 'ClienteUser')
	create user ClienteUser for Login ClienteLogin;
go

--Permisos Admin
If exists (Select * from sys.database_principals where name = 'db_datareader')	
	Alter Role db_datareader add member AdminUser;
GO
If not exists (Select * from sys.database_principals where name = 'db_datawriter')	
	Alter Role db_datawriter add member AdminUser;
go

Grant Execute To AdminUser;
Grant Alter To AdminUser;
go

-- Permisos Cliente
If IS_ROLEMEMBER('db_datareader', 'ClienteUser') = 0
	Alter Role db_datareader add member ClienteUser;
go

Grant Insert on Ventas to ClienteUser;
Grant Insert on DetallesVentas to ClienteUser;
Grant Update on Productos to ClienteUser;
go

---------------------------------------------------------------------
---------------------------------------------------------------------
/*Triggers*/

--1.
Drop Trigger if exists trg_Productos_Insert;
go
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
Drop Trigger if exists trg_Productos_Update;
go
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
Drop Trigger if exists trg_Productos_Delete;
go
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
-----------------------------------------------------------------------------------
-----------------------------------------------------------------------------------
--Ventas triggers
--4.
DROP TRIGGER IF EXISTS trg_Ventas_Insert;
GO

CREATE TRIGGER trg_Ventas_Insert
ON Ventas AFTER INSERT
AS
    DECLARE @idVenta INT, @idUsuario INT, @totalVenta DECIMAL(10,2)
    DECLARE @folioRecibo VARCHAR(50), @metodoPago VARCHAR(20)

    SELECT 
        @idVenta = IdVenta,
        @idUsuario = IdUsuario,
        @totalVenta = TotalVenta,
        @folioRecibo = FolioRecibo,
        @metodoPago = MetodoPago
    FROM inserted

    BEGIN TRANSACTION registraVenta
        SET TRANSACTION ISOLATION LEVEL READ COMMITTED

        INSERT INTO Auditoria_Ventas (
            Operacion,
            IdVenta,
            IdUsuario,
            TotalVenta,
            FolioRecibo,
            MetodoPago,
            CambiadoPor,
            Description
        )
        VALUES (
            'INSERT',
            @idVenta,
            @idUsuario,
            @totalVenta,
            @folioRecibo,
            @metodoPago,
            SYSTEM_USER,
            'Venta realizada por usuario: ' + CAST(@idUsuario AS VARCHAR) + 
            ' | Recibo: ' + ISNULL(@folioRecibo, 'SIN FOLIO')
        )

        COMMIT TRANSACTION registraVenta
        PRINT 'Venta registrada en auditoria. IdVenta: ' + CAST(@idVenta AS VARCHAR)
GO

--5.
--5.
Drop Trigger if exists trg_DetallesVentas_Insert;
go

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
				ROLLBACK TRANSACTION disminuyeStock
			end
Go
------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------
-- Billetera trigger
DROP TRIGGER IF EXISTS trg_Movimientos_Billetera_Insert;
GO

CREATE TRIGGER trg_Movimientos_Billetera_Insert
ON Movimientos_Billetera AFTER INSERT
AS
    DECLARE @idMovimiento INT, @idBilletera INT, @tipoMovimiento VARCHAR(20)
    DECLARE @monto DECIMAL(10,2), @saldoAnterior DECIMAL(10,2), @saldoNuevo DECIMAL(10,2)

    SELECT
        @idMovimiento = IdMovimiento,
        @idBilletera = IdBilletera,
        @tipoMovimiento = TipoMovimiento,
        @monto = Monto,
        @saldoAnterior = SaldoAnterior,
        @saldoNuevo = SaldoNuevo
    FROM inserted

    PRINT 'Movimiento de billetera registrado. ID: ' + CAST(@idMovimiento AS VARCHAR)
GO

------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------
-- Proteccion: Solo Clientes pueden tener Billetera

Drop Trigger If Exists trg_Billeteras_ValidarCliente;
Go

Create Trigger trg_Billeteras_ValidarCliente
ON Billeteras after INSERT, UPDATE
AS
	Declare @idUsuario INT, @role VARCHAR(10)

	Select @idUsuario = IdUsuario
	From inserted

	Select @role = Role
	From Usuarios
	Where IdUsuario = @idUsuario

	If (@role <> 'Cliente')
		Begin
			Print 'Error: Solo los usuarios con rol Cliente pueden tener billetera.'
			Rollback Transaction
		end
	Else
		Begin
			Print 'Billetera validada correctamente para Cliente.'
		end
Go

------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------
--Usuarios triggers
--6
Drop Trigger If Exists trg_Usuarios_Insert;
Go

Create Trigger trg_Usuarios_Insert
ON Usuarios after INSERT
AS
    Declare @idUsuario INT, @username VARCHAR(50), @role VARCHAR(10)

    Select 
        @idUsuario = IdUsuario,
        @username = Username,
        @role = Role
    From inserted

    Begin Transaction registraUsuarioInsert
        SET TRANSACTION ISOLATION LEVEL READ COMMITTED

        INSERT into Auditoria_Usuarios (
            Operacion,
            IdUsuario,
            UsernameNuevo,
            RoleNuevo,
            PasswordCambiado,
            CambiadoPor,
            Description
        )
        Values (
            'INSERT',
            @idUsuario,
            @username,
            @role,
            1,
            SYSTEM_USER,
            'Usuario creado: ' + @username
        )

        COMMIT Transaction registraUsuarioInsert
        Print 'Usuario registrado en auditoria: ' + @username
GO

--7
Drop Trigger If Exists trg_Usuarios_Update;
Go

Create Trigger trg_Usuarios_Update
ON Usuarios after UPDATE
AS
    Declare @idUsuario INT
    Declare @usernameViejo VARCHAR(50), @usernameNuevo VARCHAR(50)
    Declare @roleViejo VARCHAR(10), @roleNuevo VARCHAR(10)
    Declare @passwordViejo VARCHAR(255), @passwordNuevo VARCHAR(255)
    Declare @passwordCambiado BIT

    Select 
        @idUsuario = i.IdUsuario,
        @usernameViejo = d.Username,
        @usernameNuevo = i.Username,
        @roleViejo = d.Role,
        @roleNuevo = i.Role,
        @passwordViejo = d.Password,
        @passwordNuevo = i.Password
    From inserted i
    INNER JOIN deleted d ON i.IdUsuario = d.IdUsuario

    If (@passwordViejo <> @passwordNuevo)
        SET @passwordCambiado = 1
    Else
        SET @passwordCambiado = 0

    Begin Transaction registraUsuarioUpdate
        SET TRANSACTION ISOLATION LEVEL READ COMMITTED

        INSERT into Auditoria_Usuarios (
            Operacion,
            IdUsuario,
            UsernameViejo,
            UsernameNuevo,
            RoleViejo,
            RoleNuevo,
            PasswordCambiado,
            CambiadoPor,
            Description
        )
        Values (
            'UPDATE',
            @idUsuario,
            @usernameViejo,
            @usernameNuevo,
            @roleViejo,
            @roleNuevo,
            @passwordCambiado,
            SYSTEM_USER,
            'Usuario actualizado: ' + @usernameNuevo
        )

        COMMIT Transaction registraUsuarioUpdate
        Print 'Actualizacion de usuario registrada en auditoria: ' + @usernameNuevo
Go

------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------
-- Proteccion: No cambiar a Admin si el usuario tiene Billetera

Drop Trigger If Exists trg_Usuarios_ValidarCambioRolBilletera;
Go

Create Trigger trg_Usuarios_ValidarCambioRolBilletera
ON Usuarios after UPDATE
AS
	Declare @idUsuario INT, @roleViejo VARCHAR(10), @roleNuevo VARCHAR(10)

	Select 
		@idUsuario = i.IdUsuario,
		@roleViejo = d.Role,
		@roleNuevo = i.Role
	From inserted i
	Inner Join deleted d ON i.IdUsuario = d.IdUsuario

	If (@roleViejo = 'Cliente' AND @roleNuevo = 'Admin')
		Begin
			If Exists (Select 1 From Billeteras Where IdUsuario = @idUsuario)
				Begin
					Print 'Error: No se puede cambiar este Cliente a Admin porque tiene una billetera asignada.'
					Rollback Transaction
				end
		end
Go

--8
Drop Trigger If Exists trg_Usuarios_Delete;
Go

Create Trigger trg_Usuarios_Delete
ON Usuarios after DELETE
AS
    Declare @idUsuario INT, @username VARCHAR(50), @role VARCHAR(10)

    Select 
        @idUsuario = IdUsuario,
        @username = Username,
        @role = Role
    From deleted

    Begin Transaction registraUsuarioDelete
        SET TRANSACTION ISOLATION LEVEL READ COMMITTED

        INSERT into Auditoria_Usuarios (
            Operacion,
            IdUsuario,
            UsernameViejo,
            RoleViejo,
            PasswordCambiado,
            CambiadoPor,
            Description
        )
        Values (
            'DELETE',
            @idUsuario,
            @username,
            @role,
            0,
            SYSTEM_USER,
            'Usuario eliminado: ' + @username
        )

        COMMIT Transaction registraUsuarioDelete
        Print 'Eliminacion de usuario registrada en auditoria: ' + @username
Go