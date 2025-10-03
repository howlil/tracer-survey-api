# SPEK API

base URL

```
https://example.com/api/v1
```

## Auth

## ADMIN

### Manage Admin

#### get admin

```
GET /admins

Query {
    page
    limit
    filter : {
        searchName
    }
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
    meta {
        total
        limit
        page
        limitPages
    }
}


```

#### Add admin

```
POST /admin

request {
     name
     email
     username
     role : [
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
PATCH /admin/{id}

request {
     name
     email
     password
     username
     role
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
DELETE /admin/{id}


response {
    status
    message
}
```

### Manage role and permission

#### get role and permision

```
GET /admin/roles

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

#### add role and permision

POST /admin/role

request {
     roleName
     description
     rolePermission[
        {
            id
            permisionName
        },
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

#### update role and permision

```
PATCH /admin/role/{id}

request {
     roleName
     description
     rolePermission[
        {
            id
            permisionName
        },
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

#### delete role and permision

CONSTRAINT : if there is a admin in role, the role cant be deleted

```
DELETE /admin/role/{id}

response {
    status
    message
}

```

### Manage Email Blasting

### Manage Tracer

## Tracer
