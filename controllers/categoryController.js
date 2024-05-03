import categoryModel from "../models/categories.js";
import Product from "../models/product.js";
import mongoose from 'mongoose';

const { Types } = mongoose;
//create Category
export const createCategory = async (req, res) => {
    try {
      const { category } = req.body;
      // validation
      if (!category) {
        return res.status(404).send({
          success: false,
          message: "please provide category name",
        });
      }
      await categoryModel.create({ category });
      res.status(201).send({
        success: true,
        message: `${category} category creted successfully`,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error In Create Cat API",
      });
    }
  };

  export const getAllCategoriesController = async (req, res) => {
    try {
      const categories = await categoryModel.find({});
      res.status(200).send({
        success: true,
        message: "Categories Fetch Successfully",
        totalCat: categories.length,
        categories,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error In Get All Cat API",
      });
    }
  };

  // Update Category
  export const updateCategory = async(req,res) =>{
    try{
     const cat = await categoryModel.findById(req.params.id);
     if(!cat){
       return res.status(404).send({
         success:false,
         message:"Category Not Found"
       })
     }
     if(cat.shopId !== req.seller.id){
       return res.status(403).send({
         success:false,
         message:"You are not authorized to update this category"
       })
      }
     const {updatedCategory} = req.body;
     if(!updatedCategory){
       return res.status(404).send({
         success:false,
         message:"Please provide category name"
       })
     }
     cat.category = updatedCategory;
     // update category of existing products
      const products = await Product.find({category:cat._id,shop:req.seller.id});
      if(products.length > 0){
        products.forEach(async(product)=>{
          product.category = cat._id
          await product.save();
        })
      }
      await cat.save();
      res.status(200).send({
        success:true,
        message:"Category Updated Successfully"
      })
    }catch(error){
      console.log(error);
      res.status(500).send({
        success:false,
        message:"Error while updating category"
      })
    }
  }

  // Delete Category
  export const deleteCategory = async(req,res) =>{
      try{  
       const cat = await categoryModel.findById(req.params.id);
       if(!cat){
         return res.status(404).send({
           success:false,
           message:"Category Not Found"
         })
       }
       if(cat.shopId !== req.seller.id){
         return res.status(403).send({
           success:false,
           message:"You are not authorized to delete this category"
         })
        }
       const products = await Product.find({category:cat._id,shop:req.seller.id});
       if(products.length > 0){
         products.forEach(async(product)=>{
           product.category = null
           await product.save();
         })
       }
      }catch(error){
        console.log(error);
        res.status(500).send({
          success:false,
          message:"Error while deleting category"
        })
      }
  }