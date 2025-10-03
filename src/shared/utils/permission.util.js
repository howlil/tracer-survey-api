const { object } = require('joi');
const RESOURCES = require('../constants/resource.constant');

class PermissionUtil {


    static generatePermision() {

        const permissions = []

        // mapping resources constant
        Object.values(RESOURCES).forEach(resource => {

            // mapping resources constant especially actions and push into array permission
            resource.actions.forEach(action => {
                permissions.push({
                    permissionName: `${resource.name}.${action}`,
                    resource: resource.name,
                    action: action
                })
            });

            // generate sub-resource if exists

            if (resource.subResources) {
                Object.values(resource.subResources).forEach(subResource => {
                    subResource.actions.forEach(action => {
                        permissions.push({
                            permissionName: `${subResource.name}.${action}`,
                            resource: subResource.name,
                            action: action
                        });
                    })
                })
            }

        })

        return permissions
    }

    static getPermission(resourceKey, action) {
        const resource = RESOURCES[resourceKey]

        if (!resource) {
            throw new Error(` Resource ${resourceKey} not Found`)
        }

        const permissionName = `${resource.name}.${action}`

        const allAction = resource.actions
        if (resource.subResource) {
            Object.values(resource.subResource).forEach(sub => {
                allAction.push(...sub.actions)
            })
        }

        if (!allActions.includes(action)) {
            throw new Error(`Action ${action} not found for resource ${resourceKey}`);
        }

        return permissionName;

    }

    static generateConstant( ){
        const constant = {}

        Object.entries(RESOURCES).forEach(([key,resource])=>{
            constant[key] = {}

            resource.actions.forEach(action=>{
                const constantKey = action.toUpperCase().replace(".","_")
                constant[key][constantKey]= `${resource.name}.${action}`
            })

            if(resource.subResources) {
                object.entries(resource.subResources).forEach(([subKey,subResource])=>{
                    constant[key][subKey] = {}
                    subResource.actions.forEach(action =>{
                        const constantKey = action.toUpperCase().replace(".","_")
                        constant[key][subKey][constantKey] = `${subResource.name}.${action}`
                    })
                })
            }
        })
        return constant
    }


}


module.exports = PermissionUtil