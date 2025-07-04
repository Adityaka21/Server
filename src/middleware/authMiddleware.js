const jwt = require('jsonwebtoken');
const Users = require('../model/Users');
const authMiddleware = {
    protect: async (request, response, next) => {
        try {
            const token = request.cookies?.jwtToken;
            if (!token) {
                return response.status(401).json({ message: 'Unauthorized access' });
            }

            const user = jwt.verify(token, process.env.JWT_SECRET);
            if(user){
                request.user = await Users.findById({_id: user.id});
            }else {
                return response.status(401).json({
                    message: "Invalid token"
                });
            }
            next();
        }catch (error) {
            console.log(error);
            return response.status(401).json({ message: 'Internal server error' });

        }
    },
}

module.exports = authMiddleware;