const permission = require('../constants/permission');

const authorize = (requiredPermission) => {
    return (request,response,next) => {
        const user = request.user; //authmiddleware will run before this middleware

        if(!user){
            return response.status(401).json({
                message: 'Unauthorized'
            });
        }

        // console.log(permission);
        const userPermission = permission[user.role] || [];
        // console.log(userPermission);
        // console.log(requiredPermission);
        if(!userPermission.includes(requiredPermission)){
              return response.status(403).json({
                message: 'Forbidden: Insufficient Permission'
            });
        }

        next();
    };

};

module.exports= authorize