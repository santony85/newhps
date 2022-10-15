        
		
		$(document).ready(function () {
            
            $('.newbt').click(function(){
	          $('#myform')[0].reset();  
	          //$('#myform2')[0].reset(); 
            })

        	$("#myform").on('submit', function(e){
			 e.preventDefault();
			 
			 var mdata = $('#myform').serialize();
			 console.log(mdata)
			 
			 //var db=page;
			 //if(page=="teles" || page=="users" || page=="collabs")db="users";
			 
			 
			 //var comp=""
			 if( typeof page == "undefined")db="newhpsrdv";
			 else if(page == "newhpsusers")db="newhpsusers";
			 else if(page == "produits")db="produits";
			 else db="newhpsrdv";

				 
				$.ajax({
					url:'/addobj/'+db,
					type:'post',
					data:$('#myform').serialize(),
					success:function(res){
						$('#exampleModalCenter').modal('hide');

						//if(page=="planning"){
							
							/*var idc=res.upserted[0]._id;
							var ncli = $('#nom').val()+" "+$('#prenom').val();
							var uid = $('#userId').val();
							if(uid !== "")window.location.href = '/planning/'+uid+'/'+idc+'/'+ncli;
							else window.location.href = '/'+page+comp;*/
							
							location.reload();
							return false;
							
						//}

						//else window.location.href = '/'+page+comp;
						
        			}
    			});
    			return false;
	
            });	
            
        })
		
		function isRdvEnable(idcli){
			var jr = myform.dateRdv0.value;
			var hr = myform.heureRDV.value;
			
			var dt = jr.split('-');
			var ht = hr.split(':'); 
			
			var tst = new Date(dt[0],parseInt(dt[1])-1, dt[2],ht[0],ht[1])
			
			console.log(tst);
			//newhpsrdv -> idcomhps1 = idcli
			$.ajax({
				url: '/restobj/'+idcli+'/all',
				type:'get',
				success:function(data){
					var flag=0;
					var today = new Date();
					data.data.forEach(elm =>{
					  //console.log(elm.start)
					  var ndt = new Date(elm.start);
					  var nft = new Date(elm.start)
					  nft.setMinutes(nft.getMinutes() + 59);
					  //if(ndt > today){
						console.log(ndt)
						if(tst >= ndt && tst <= nft)flag=1;  
					  //}
					  
					  //else flag=1;
					  //console.log(ndt)
					  //console.log(nft)	
					  //if(tst >= ndt )flag=1;
					  	
					  })
					
					if(flag){
						alert("Date non disponible");
						//myform.dateRdv0.value="";
						myform.heureRDV.value="";
						return true;
					}
					return false;
					
					
					}
			});
			
		}
        
        function editobj(mid){
			    $('#myform')[0].reset();
				//$('input[name=_id]').val(mid);
				$('[snd-data-'+mid.toString()+']').each(function(i, el) // Temporary for demo purpose only
					{
					var $this   = $(el);
					var label   = $this.attr("snd-data-"+mid);
					var valeur  = $this.html();
					$('input[name='+label+']').val(valeur);
					});
			
		}
		
		function editobjNEW(mid,vlist){
			$('#myform')[0].reset();
			var compo={}
			vlist.forEach((data)=>{
			  if(data._id == mid)compo=data;
			})
			console.log(compo);
			$("#myform").each(function(){
				var it = $(this).find(':input') //<-- Should return all input elements in that specific form.
				for (var i=0;i<it.length;i++){
					if(it[i].name == "dateRdv"){
					  var today = new Date(compo[it[i].name]);
					  var dd = String(today.getDate()).padStart(2, '0');
					  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
					  var yyyy = today.getFullYear();
					  today = yyyy + '-' + mm + '-' + dd;
					  console.log(today)
					  $('input#'+it[i].name).val(today); 	
					}
					if(compo[it[i].name])$('input[name='+it[i].name+']').val(compo[it[i].name]);
				}
				it = $(this).find('textarea');
				for (var i=0;i<it.length;i++){
				  if(compo[it[i].name])$('textarea[name='+it[i].name+']').val(compo[it[i].name]);	
				}
				
			});
			/*$('#myform')[0].reset();
			//$('input[name=_id]').val(mid);
			$('[snd-data-'+mid.toString()+']').each(function(i, el) // Temporary for demo purpose only
				{
				var $this   = $(el);
				var label   = $this.attr("snd-data-"+mid);
				var valeur  = $this.html();
				$('input[name='+label+']').val(valeur);
				});*/
		
	}
	
	
		function confirmdel(id){
        	bootbox.confirm("Voulez-vous supprimer cet element ?", function(result) {
            if(result){
	            var db=page;
			 if(page=="teles" || page=="users" || page=="collabs")db="users";
             if(page=="params")db="issues"; 
			 if(page=="rapports")db="newhpsrdv";  
                $.ajax({
					url:'/delobj/'+db+'/'+id,
					type:'get',
					success:function(){
						//window.location.href = '/'+page;
						location.reload();
						return false;
						
						
        				}
    			});
                
                
            	}
        	});
    	}