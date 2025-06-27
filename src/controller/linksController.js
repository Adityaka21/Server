const { request } = require("http");
const { userInfo } = require("os");
const Links = require("../model/Links");

const linkController = {
    create: async (request, response) => {
        try{
            const { compaignTitle, orginalUrl, category, thumbnail } = request.body;
            const link = new Links({
                compaignTitle: compaignTitle,
                orginalUrl: orginalUrl,
                category: category,
                user: request.user.id
                
            });
            await link.save();
            response.status(200).json({data: {id: link._id},
                 message: 'Link created successfully'
                });
        }catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    getAll: async (request, response) => {
         try{
            const links = await Links.find({ user: request.user.id }).sort({ createdAt: -1 });
            return response.json({data: links});
           

        }catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    getById: async (request, response) => {
         try{
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
            if(link.user.toString() !== request.user.id) {
                return response.status(403).json({ message: 'Unauthorized access' });
            }

            response.json({data: link});
        }catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },
    update: async (request, response) => {
         try{
            const linkId = request.params.id;
            if (!linkId) {
                return response.status(401).json({ message: 'Link ID is required' });
            }

            const link = await Links.findById(linkId);
            if (!link) {
                return response.status(404).json({ error: 'Link not found' });
            }

             if(link.user.toString() !== request.user.id) {
                return response.status(403).json({ message: 'Unauthorized access' });
            }

            const { compaignTitle, orginalUrl, category, thumbnail } = request.body;
           
             link = await Links.findByIdAndUpdate(linkId, {
                compaignTitle: compaignTitle,
                orginalUrl: orginalUrl,
                category: category,
                
            },{ new: true});

           response.json({data: link});
        }catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },
    delete: async (request, response) => {
         try{
            const linkId = request.params.id;
            if (!linkId) {
                return response.status(401).json({ message: 'Link ID is required' });
            }

            const link = await Links.findById(linkId);
            if (!link) {
                return response.status(404).json({ error: 'Link not found' });
            }
           
            if(link.user.toString() !== request.user.id) {
                return response.status(403).json({ message: 'Unauthorized access' });
            }

            await link.deleteOne();
            response.json({message: 'Link deleted successfully'});
        }catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },
    redirect: async (request, response) => {
         try{
            const linkId = request.params.id;
            if (!linkId) {
                return response.status(401).json({ message: 'Link ID is required' });
            }

            const link = await Links.findById(linkId);
            if (!link) {
                return response.status(404).json({ error: 'Link not found' });
            }

            link.clickcount += 1;
            await link.save();

            response.redirect(link.orginalUrl);
        }catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },
};

module.exports = linkController;