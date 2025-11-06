<!-- @format -->

# SPEK API

base URL

```
https://example.com/api/
```

## Auth

#### login admin

#### login alumni

#### login manager

---

## ADMIN

### Manage Admin

#### get admin

```
GET v1/admins



response {
    status
    message
    data {
        id
        name
        username
        email
        role
        isActive
    }
}

```

#### Add admin

```
POST v1/admin

request {
     name
     email
     username
     isaActive
     role : [
        id,
        id
     ]
}

NOTE password : default

response {
    status
    message
    data {
        id
        name
        username
        email
        role
        isActive
    }
}

```

#### edit admin

```
PATCH v1/admin/{id}

request {
     name
     email
     username
     role : [id]
     isActive
}

response {
    status
    message
    data {
        id
        name
        username
        email
        role
        isActive
    }
}

```

#### delete admin

```
DELETE v1/admin/{id}


response {
    status
    message
}
```

### Manage role and permission [DONE]

#### get role and permision [DONE]

```
GET /v2/roles
response {
    status
    message
    data {
        id
        roleName
        description
    }
}



GET /v1/roles  [DONE]

response {
    status
    message
    data {
        id
        roleName
        description
        rolePermission[
        {
            id
            permisionName
        },
     ]
    }
}


```

#### add role and permision [DONE]

POST v1/role

request {
roleName
description
rolePermission[
id
]

}

response {
status
message
data {
id
roleName
description
rolePermission[
{
i
permisionName
},
]
}
}

#### update role and permision [DONE]

```
PATCH v1/rolee/{id}

request {
     roleName
     description
     rolePermission[
            id
     ]
}

response {
    status
    message
    data {
        id
        roleName
        description
        rolePermission[
            {
                id
                permisionName
            },
        ]
    }
}
```

#### delete role and permision [DONE]

CONSTRAINT : if there is a admin in role, the role cant be deleted

```
DELETE v1/role/{id}

response {
    status
    message
}

```

### Manage database Alumni

#### get alumni

GET v1/alumnis

req query {
page
limit
where {
search,
facultyId
majorId
degree
graduateYear
periodegraduate
}
}

res {
status
message
data : {
id
nim
namaLengkap
email
fakultas
prodi
jenjang
tahunLulus
periodeWisuda
}
meta :{
page
limit
total
totalPages
}
}

#### POST alumni

POST v1/alumni

// NOTE pin alumni langsung kebikin jadi ada 2 untuk alumni dan untuk usernya

req : {
nim
namaLengkap
email
fakultas
prodi
jenjang
tahunLulus
periodeWisuda
}

res {
status
message
data : {
id
nim
namaLengkap
email
fakultas
prodi
jenjang
tahunLulus
periodeWisuda
}
}

#### PATCH alumni

PATCH v1/alumni

req : {
nim
namaLengkap
email
fakultas
prodi
jenjang
tahunLulus
periodeWisuda
}

res {
status
message
data : {
id
nim
namaLengkap
email
fakultas
prodi
jenjang
tahunLulus
periodeWisuda
}
}

#### POST EXCEL alumni

POST v1/alumni/import-excel

req.file : {
excelAlumni
}

res {
status
message
}

### manage manager

#### get manager

GET v1/managers

req query {
page
limit
where {
search,
company
}
}

res {
status
message
data : {
id
namaLengkap
email
perusahaan
posisi
alumni : []
}
meta :{
page
limit
total
totalPages
}
}

#### POST manager

POST v1/managers

// pin alumni dapat ketika mereka terhubung

req : {
namaLengkap
email
perusahaan
posisi
alumni : []
}

res {
status
message
data : {
id
namaLengkap
email
perusahaan
posisi
alumni : []
}
}

#### PATCH manager

PATCH v1/manager/{id}

req : {
namaLengkap
email
perusahaan
posisi
alumni : []
}

res {
status
message
data : {
id
namaLengkap
email
perusahaan
posisi
alumni : []
}
}

#### POST EXCEL manager

PATCH v1/manager/import-excel

req.file : {
excelManager
}

res {
status
message
}

---



