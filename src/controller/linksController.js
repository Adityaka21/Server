const Links = require("../model/Links");
const Users = require("../model/Users");
const Clicks = require("../model/Clicks");
const { getDeviceInfo } = require("../util/linksUtility");
const axios = require('axios');

const linkController = {
    create: async (request, response) => {
        const { compaignTitle, orginalUrl, category, thumbnail } = request.body;
        try {
            const user = await Users.findById({_id: request.user.id});
            if (user.credits < 1){
                return response.status(400).json({
                    code : "ISUFFICIENT_FUNDS",
                    message: "Insufficient Credits"
                });
            }

            const link = new Links({
                compaignTitle: compaignTitle,
                orginalUrl: orginalUrl,
                category: category,
                user: request.user.role === 'admin' ? request.user.id : request.user.adminId

            });
            await link.save();

            user.credits -= 1;
            await user.save();
            response.status(200).json({
                data: { id: link._id },
                message: 'Link created successfully'
            });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    getAll: async (request, response) => {
        try {
            const userId = request.user.role === 'admin' ? request.user.id : request.user.adminId;
            const links = await Links.find({ user: userId }).sort({ createdAt: -1 });
            return response.json({ data: links });


        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    getById: async (request, response) => {
        try {
            const userId = request.user.role === 'admin' ? request.user.id : request.user.adminId;
            const linkId = request.params.id;
            if (!linkId) {
                return response.status(401).json({ message: 'Link ID is required' });
            }

            const link = await Links.findById(linkId);
            if (!link) {
                return response.status(404).json({ error: 'Link not found' });
            }
            //Make sure the link exists
            //belongs to the user
            if (link.user.toString() !== userId) {
                return response.status(403).json({ message: 'Unauthorized access' });
            }

            response.json({ data: link });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },
    update: async (request, response) => {
        try {
            const userId = request.user.role === 'admin' ? request.user.id : request.user.adminId;
            const linkId = request.params.id;
            if (!linkId) {
                return response.status(401).json({ message: 'Link ID is required' });
            }

            let link = await Links.findById(linkId);
            if (!link) {
                return response.status(404).json({ error: 'Link not found' });
            }

            if (link.user.toString() !== userId) {
                return response.status(403).json({ message: 'Unauthorized access' });
            }

            const { compaignTitle, orginalUrl, category, thumbnail } = request.body;

            link = await Links.findByIdAndUpdate(linkId, {
                compaignTitle: compaignTitle,
                orginalUrl: orginalUrl,
                category: category,

            }, { new: true });

            response.json({ data: link });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },
    delete: async (request, response) => {
        try {
            const userId = request.user.role === 'admin' ? request.user.id : request.user.adminId;
            const linkId = request.params.id;

            if (!linkId) {
                return response.status(400).json({ message: 'Link ID is required' });
            }

            const link = await Links.findById(linkId);
            if (!link) {
                return response.status(404).json({ error: 'Link not found' });
            }


            if (link.user.toString() !== userId.toString()) {
                return response.status(403).json({ message: 'Unauthorized access' });
            }

            await Links.deleteOne({ _id: linkId });
            response.json({ message: 'Link deleted successfully' });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },
    redirect: async (request, response) => {
        try {
            const linkId = request.params.id;
            if (!linkId) {
                return response.status(401).json({ message: 'Link ID is required' });
            }

            const link = await Links.findById(linkId);
            if (!link) {
                return response.status(404).json({ error: 'Link not found' });
            }

            const isDevelopment = process.env.NODE_ENV === 'development';
            const ipAddress = isDevelopment 
            ? '8.8.8.8'
            : request.headers['x-forward-for']?.split(',')[0] || request.socket.remoteAddress;
            
            const getResponse = await axios.get(`http://ip-api.com/json/${ipAddress}`);
            const { city, country, region,lat,lon,isp} = getResponse.data;

            const userAgent = request.headers['user-agent'] || 'Unknown';
            const { deviceType, browser} = getDeviceInfo(userAgent);

            const refferrer = request.get('Refferrer') || null;

            await Clicks.create({
                linkId: link._id,
                ip: ipAddress,
                city: city,
                country: country,
                region: region,
                latitude: lat,
                longitude: lon,
                isp: isp,
                refferrer: refferrer,
                userAgent: userAgent,
                deviceType: deviceType,
                browser: browser,
                clickedAt: new Date()
            });

            link.clickcount += 1;
            await link.save();

            response.redirect(link.orginalUrl);
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    analytics: async(request,response) => {
        try{
            const { linkId, from ,to} = request.query;

            const link = await Links.findById(linkId);
            if(!link){
                return response.status(404).json({ error: 'Link not found' });
            }
            
            const userId = request.user.role === 'admin' ? request.user.id : request.user.adminId;
            if(link.user.toString()!== userId){
                return response.status(403).json({ error: 'Unauthorized access' });

            } 

            const query = {
                linkId: linkId,
            };
            if(from && to ){
                query.clickedAt =  { $gte: new Date(from), $lte: new Date(to)};
            }
            const data = await Clicks.find(query).sort({ clickedAt: -1});
            response.json(data);

        }catch(error){
              console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        
        }
    }
};

module.exports = linkController;