export const criteria ={
	'0':{	name:"Période d'observation",
			detail:"Période pendant laquelle vous avez photographié votre spécimen.",
			photo_etat:900,
			values:{
				'0':{	id:0,name:'Janvier'},
				'1':{	id:1,name:'Février'},
				'2':{	id:2,name:'Mars'},
				'3':{	id:3,name:'Avril'},
				'4':{	id:4,name:'Mai'},
				'5':{	id:5,name:'Juin'},
				'6':{	id:6,name:"Juillet"},
				'7':{	id:7,name:'Août'},
				'8':{	id:8,name:'Septembre'},
				'9':{	id:9,name:'Octobre'}, 
				'10':{	id:10,name:'Novembre'},
				'11':{	id:11,name:'Décembre'},
			},
		},
	'1':{	name:"Quelle est l'allure générale de votre spécimen à identifier ?",
			detail:null, 
			photo_etat:100,
			values:{
				'0':{id:12, name:"Allure de scarabée ou de punaise (Coléoptères, Hémiptères)"},
				'1':{id:13, name:"Allure de papillon (Lépidoptères)"},
				'2':{id:14, name:"Allure de mouche, d'abeille, de guêpe ou de bourdon (Diptères et Hyménoptères)"},
				'3':{id:15, name:"Allure de chenille ou d'autre larve"},
				'4':{id:16, name:"Allure d'araignée (Arachnides)"},
				'5':{id:17, name:"Autres aspects"},
			},
		},


	// Papillon
	'2':{	name:"Forme des antennes de votre papillon",
			detail:"Il est coutume de répartir les papillons (Lépidoptères) en papillons \"de jour\" (Rhopalocères) ou \"de nuit\" (Hétérocères) qui se différencient essentiellement par la forme des antennes. \nMais attention, certains papillons \"de nuit\" volent le jour !",
			condition:{'1':[1]},
			photo_etat:110,
			values:{
				'0':{
					id:18, 
					name:"Antennes en forme de massue",
					detail:"Elles se terminent par un renflement, on parle de bouton antennaire.\nAttention : les Zygènes qui sont des Hétérocères (papillons \"de nuit\") possèdent des antennes similaires."
				},
				'1':{
					id:19, 
					name:"Antennes de forme différente",
					detail:"Elles peuvent être de formes diverses : plumeuses, fines et pointues... Dans ce cas, il s'agit toujours d'Hétérocères (papillons \"de nuit\").",
				}
			}
		},
	'3':{	name:"Face du papillon observée",
			detail:null,
			condition:{'1':[1], '2':[0]}, // papi, jour} 
			photo_etat:980,
			values:{
				'0': {id:20, name:"Dessus des ailes visible uniquement"},
				'1': {id:21, name:"Dessous des ailes visible uniquement"},
				'2': {id:22, name:"Dessus et dessous des ailes visibles"}
			}
		},


	// Coléoptère
	'4':{	name:"Type d'élytres",
			detail:"Chez les Coléoptères (scarabés, coccinelles, ...) et les Hémiptères (punaises), la première paire d'ailes est transformée en élytres ou demi-élytres. Celles-ci sont plus ou moins coriaces mais peuvent aussi être atrophiées et réduites.",
			condition:{'1':[0]},
			photo_etat:340,
			values:{
				'0': {id:23, name:"Elytres séparées par une ligne droite",
					detail:"Les élytres sont séparées par une ligne droite.\nSous ces élytres, se trouvent des ailes membraneuses avec lesquelles le coléoptère peut voler.",
					},
				'1': {id:24, name:"Ailes dissimulées sous une carapace uniforme",
					detail:"Chez certaines punaises, les élytres sont modifiés en une véritable carapace uniforme sous lesquels se trouvent les ailes membraneuses.",
					},
				'2': {id:25, name:"Ailes coriaces à la base et membraneuse au bout",
					detail:"Chez d'autres punaises, leur première paire d'ailes est constituée de demi-élytres. Ces ailes sont coriaces à la base et membraneuses au bout. Il est parfois difficile de discerner la jonction entre la partie coriace et membraneuse.",
					},
				'4': {id:26, name:"Ailes atrophiées",
					detail:"Les élytres ou demi-élytres sont atrophiées. C'est le cas des juvéniles.",
					},
				}
		},
	'5':{	name:"Ecartement des élytres à leur extrémité",
			detail:"Chez la majorité des coléoptères, les élytres (ailes coriaces) sont accolés sur toute leur longueur. Dans d'autres cas, ceux-ci sont écartés à l'extrémité.",
			condition:{'1':[0], '4':[0]},
			photo_etat:350,
			values:{
				'0': {id:27, name:"Elytres réunis à leur extrémité",
					detail:"Lorsqu'ils sont au repos, plaqués le long du corps, les élytres sont réunis à leur extrémité.",
					},
				'1': {id:28, name:"Elytres écartés à leur extrémité",
					detail:"Lorsqu'ils sont au repos, plaqués le long du corps, les élytres sont écartés à leur extrémité.",
					},
				}
		},
	'6':{	name:"Présence ou absence d'un \"nez\"",
			condition:{'1':[0,2,5]},
						// 		Coléo et élytres droites  //'1':[0],'4':[0]
						// 		Abeilles
						// 		Autres
						// Argh !!! Should do something like
						// 'allure_1':{
						//		0(coléo): {
						//			type_élytre:{
						//				0(droites): true
						//				1(blabla):{y: true}
						//			}, 
						//			blabla:{true}
						//		}
						//      2(abeille):true    
						//		5(autre):true
			detail:"Présence ou absence d'un long \"nez\" (rostre) sur lequel s'insèrent les antennes. Il s'agit du prolongement de la tête, la bouche se trouvant à l'extrémité.",
			photo_etat:360,
			values:{
				'0': {id:29, name:"Présence d'un \"nez\"",
					detail:"La tête est prolongée par un long \"nez\" (rostre) sur lequel s'attachent les antennes.",
					},
				'1': {id:30, name:"Absence d'un \"nez\"",
					detail:"La tête n'est pas prolongée par un \"nez\".",
					},
				}
		},

	'7':{	name:"Taille",// (Coléoptère, Hémiptère)
			detail:"La taille se mesure de l'extrémité de la tête à l'extrémité de l'abdomen.",
			condition:{'1':[0], '4':[0]},
			photo_etat:370,
			values:{
				'0': {id:31, name:"Moins de 5 mm",
					detail:"Spécimen très petit, moins de 5 mm.",
					},
				'1': {id:32, name:"Plus de 5 mm",
					detail:"",
					},
				}
		},
	'8':{	name:"Forme des antennes",
			detail:null,
			condition:{'1':[0]},
			photo_etat:380,
			values:{
				'0': {id:33, name:"Régulières et pointues" },
				'1': {id:34, name:"En massues ou en feuillets" },
				}
	},
	'9':{	name:"Coloration des antennes",
			condition:{'1':[0], '8':[0]},
			detail:null,
			photo_etat:390,
			values:{
				'0': {id:35, name:"Unie",
					detail:"Antennes globalement d'une seule couleur, des nuances sont possibles.",
					},
				'1': {id:36, name:"Nettement bicolores",
					detail:"Antennes de deux couleurs bien distinctes.",
					},
				}
		},
	'10':{	name:"Présence ou absence de motifs sur les élytres ou demi-élytres",
			condition:{'1':[0]},
			detail:"Les élytres sont les ailes coriaces des Coléoptères (scarabés, coccinelles...). Les demi-élytres sont des ailes mi-coriace mi-membraneuse de certains Hémiptères (punaises).",
			photo_etat:400,
			values:{
				'0': {id:37, name:"Présence de motifs",
					detail:"Les motifs sont bien distincts de la couleur de fond.",
					},
				'1': {id:38, name:"Absence de motifs",
					detail:"Les élytres ou demi-élytres sont d'une seule couleur.\nDans le cas où les élytres présenteraient de légères nuances de couleur sans pour autant présenter de motifs (taches, points, rayures etc.), elles sont considérées comme unies.",
					},
				}
		},
	'11':{	name:"Couleurs principales des élytres ou demi-élytres",
			condition:{'1':[0], '10':[0,1]},
			detail:"Les élytres sont les ailes coriaces des Coléoptères (scarabés, coccinelles...). Les demi-élytres sont des ailes mi-coriace mi-membraneuse de certains Hémiptères (punaises). \nIl est parfois difficile de discerner la couleur des demi-élytres, dans ce cas, ne renseignez pas ce caractère.",
			photo_etat:410,
			values:{
				'0': {id:39, name:"Noir et rouge"},
				'1': {id:40, name:"Noir et blanc"},
				'2': {id:41, name:"Noir et jaune"},
				'3': {id:42, name:"Noir et orange/marron/beige"},
				'4': {id:43, name:"Vert et blanc"},
				'5': {id:44, name:"Violet et bleu/vert"},
				'6': {id:45, name:"Autres associations de couleurs"},
				'7': {id:46, name:"Plus de 2 couleurs franches"},
				}			
		},
	'12':{	name:"Motifs principaux sur les élytres et demi-élytres",
			condition:{'1':[0], '10':[0]},
			detail:"Les élytres sont les ailes coriaces des Coléoptères (scarabés, coccinelles...). Les demi-élytres sont des ailes mi-coriace mi-membraneuse de certains Hémiptères (punaises).\nLes motifs sont bien distincts de la couleur de fond.",
			photo_etat:420,
			values:{
				'0': {id:47, name:"Points"},
				'1': {id:48, name:"Bandes (continues ou non), rayures", detail:"Des bandes ou rayures ornent les élytres ou demi-élytres. Peuvent être verticales ou horizontales par rapport à l'axe du corps."},
				'2': {id:49, name:"Autres motifs"},
			}
		},
	'13':{	name:"Présence ou absence de motifs sur le thorax",// (Coléoptère, Hémiptère)
			condition:{'1':[0]},
			detail:"Le thorax est la partie médiane du corps, entre la tête et l'abdomen.\nLa coloration du thorax peut être unie (et donc sans aucun motif) ou avec des motifs bien distincts.",
			photo_etat:430,
			values:{
				'0': {id:50, name:"Présence de motifs", detail:"Le thorax est composé de plusieurs couleurs. Les motifs sont bien distincts de la couleur de fond."},
				'1': {id:51, name:"Absence de motifs", detail:"Le thorax est composé d'une seule couleur. De légères nuances sont toutefois possibles."},
			}
		},
	'14':{	name:"Couleur du thorax",// (Coléoptère, Hémiptère)
			condition:{'1':[0], '13':[1]},
			detail:"Le thorax est la partie médiane du corps, entre la tête et l'abdomen.\nAttention ! Si vous hésitez entre différentes couleurs, vous pouvez en cocher plusieurs.",
			photo_etat:440,
			values:{
				'0': {id:52, name:"Noir"},
				'1': {id:53, name:"Marron foncé"},
				'2': {id:54, name:"Orange, fauve, marron clair"},
				'3': {id:55, name:"Rouge"},
				'4': {id:56, name:"Bleu"},
				'5': {id:57, name:"Vert"},
				'6': {id:58, name:"Jaune"},
				'7': {id:59, name:"Autres couleurs"},
			}		
		},
	'15':{	name:"Motifs sur le thorax",//(Coléoptère, Hémiptère)
			condition:{'1':[0], '13':[0]},
			detail:"Le thorax est la partie médiane du corps, entre la tête et l'abdomen.\nLes motifs sont bien distincts de la couleur de fond.",
			photo_etat:450,
			values:{
				'0': {id:60, name:"Rayures verticales (parallèles à l'axe du corps)"	},
				'1': {id:61, name:"Rayures horizontales (perpendiculaires à l'axe du corps)"	},
				'2': {id:62, name:"Points"	},
				'3': {id:63, name:"Autres motifs"	},
			}
		},


	// Abeilles
	'16':{	name:"Type de coloration de l'abdomen",
			condition:{'1':[2]},
			detail:"L'abdomen est la partie postérieure du corps. \nLa coloration de l'abdomen peut être unie (et donc sans aucun motif), avec deux couleurs bien distinctes ou plus de deux couleurs.",
			photo_etat:460,
			values:{
				'0': {id:64,name:"Uni", detail:"L'abdomen est composée d'une seule couleur. De légères nuances sont toutefois possibles."},
				'1': {id:65, name:"Plusieurs couleurs", detail:"L'abdomen est composé de plusieurs couleurs franches."},
			}	
		},
	'17':{	name:"Motifs et taches sur l'abdomen",
			detail:"L'abdomen est la partie postérieure du corps.\nUne ou des bandes de couleur sont nettement visibles sur l'abdomen.",
			condition:{'1':[2], '16':[1]},
			photo_etat:470,
			values:{
				'0': {id:66, name:"Une bande large de couleur bien distincte", detail:"En dehors du noir, une bande de couleur est nettement visible sur l'abdomen. On ne considère pas le noir comme étant une bande."},
				'1': {id:67, name:"Deux bandes larges de couleur bien distinctes", detail:"En dehors du noir, deux bandes de couleurs sont nettement visibles sur l'abdomen. On ne considère pas le noir comme étant une bande."},
				'2': {id:68, name:"Plusieurs bandes fines de couleur bien distinctes les unes des autres", detail:"" },
				'3': {id:69, name:"Au moins une bande discontinue"},
				'4': {id:70, name:"Autres",detail:"Aucune bande de couleur bien nette."},
			}	
		},
	'18':{	name:"Couleur de l'extrémité de l'abdomen",
			condition:{'1':[2], '16':[1]},
			detail:"L'abdomen est la partie postérieure du corps.\nCouleur de la partie la plus postérieure de l'abdomen.",
			photo_etat:480,
			values:{
				'0': {id:71, name:"Noir"	},
				'1': {id:72, name:"Blanc"	},
				'2': {id:73, name:"Jaune"	},
				'3': {id:74, name:"Rouge ou rouge/orangé"	},
			}
		},
	'19':{	name:"Couleur de la bande sur l'abdomen",
			condition:{'1':[2], '16':[1], '17':[0]},
			detail:"L'abdomen est la partie postérieure du corps.\nCouleur de la bande colorée présente sur l'abdomen.",
			photo_etat:490,
			values:{
				'0': {id:75, name:"Blanc"	},
				'1': {id:76, name:"Jaune"	},
				'2': {id:77, name:"Rouge"	},
			}			
		},
	'20':{	name:"Couleur de l'abdomen uni",
			condition:{'1':[2],'16':[0]},
			detail:"L'abdomen est la partie postérieure du corps.",
			photo_etat:510,
			values:{
				'0': {id:78, name:"Noir"	},
				'1': {id:79, name:"Marron à fauve"	},
				'2': {id:80, name:"Orange"	},
				'3': {id:81, name:"Rouge"	},
				'4': {id:82, name:"Autre couleur"}
			}
		},
	'21':{	name:"Couleurs principales de l'abdomen",
			detail:"L'abdomen est la partie postérieure du corps.\nChoisissez les deux couleurs principales (de fond) présentes sur l'abdomen.",
			condition:{'1':[2],'16':[1]},
			photo_etat:520,
			values:{
				'0': {id:83, name:"Noir et jaune pâle à jaune vif"	},
				'1': {id:84, name:"Noir et jaune orangé/fauve/marron"	},
				'2': {id:85, name:"Noir et rouge/rouge orangé"	},
				'3': {id:86, name:"Noir et blanc"	},
				'4': {id:87, name:"Noir et vert"},
				'5': {id:88, name:"Autres couleurs ou plus de 2 couleurs franches"}
			}
		},
	'22':{	name:"Type de coloration du thorax",
			condition:{'1':[2]},
			detail:"Le thorax est la partie médiane du corps, entre la tête et l'abdomen.\nLa coloration du thorax peut être unie (et donc sans aucun motif) ou avec des motifs bien distincts.",
			photo_etat:530,
			values:{
				'0': {id:89, name:"Unie"},
				'1': {id:90, name:"Plusieurs couleurs"},
			}	
		},
	'23':{	name:"Couleur unie du thorax",
			detail:"Le thorax est la partie médiane du corps, entre la tête et l'abdomen. Il est dépourvu de motifs.\nAttention ! Si vous hésitez entre différentes couleurs, vous pouvez en cocher plusieurs.",
			condition:{'1':[2],'22':[0]},
			photo_etat:560,
			values:{
				'0': {id:91, name:"Noir"	},
				'1': {id:92, name:"Gris"	},
				'2': {id:93, name:"Orange, marron, fauve"	},
				'3': {id:94, name:"Rouge"	},
				'4': {id:95, name:"Vert"},
				'5': {id:96, name:"Autre couleur"}
			}	
		},
	'24':{	name:"Couleurs principales du thorax",
			condition:{'1':[2],'22':[1]},
			detail:"Le thorax est la partie médiane du corps, entre la tête et l'abdomen.\nQuelles sont les deux couleurs principales (de fond) présentes sur le thorax ?",
			photo_etat:570,
			values:{
				'0': {id:97, name:"Noir et jaune pâle à jaune vif"	},
				'1': {id:98, name:"Noir et jaune orangé/fauve/marron"	},
				'2': {id:99, name:"Noir et rouge/rouge orangé"	},
				'3': {id:100, name:"Noir et blanc"	},
				'4': {id:101, name:"Noir et vert"},
				'5': {id:102, name:"Autres couleurs ou plus de 2 couleurs franches"}
			}
		},
	'25':{	name:"Motifs sur le thorax",
			condition:{'1':[2],'22':[1]},
			detail:"Le thorax est la partie médiane du corps, entre la tête et l'abdomen.\nLes motifs sont bien distincts de la couleur de fond.",
			photo_etat:540,
			values:{
				'0': {id:103, name:"Rayures verticales (parallèles à l'axe du corps)"	},
				'1': {id:104, name:"Masque"	},
				'2': {id:105, name:"Une bande colorée (perpendiculaire à l'axe du corps)"	},
				'3': {id:106, name:"Deux bandes colorées (perpendiculaires à l'axe du corps)"	},
				'4': {id:107, name:"Autres"}
			}
		},
	'26':{	name:"Taches claires sur le corps, les pattes, la face",
			condition:{'1':[2]},
			detail:null,
			photo_etat:690,
			values:{
				'0': {id:108, name:"Sur le \"cou\""	},
				'1': {id:109, name:"Sur la face"	},
				'2': {id:110, name:"Sur les \"genoux\""	},
				'3': {id:111, name:"Sur le thorax"	},
				'4': {id:112, name:"Absence de tache"}
			}
		},
	'27':{	name:"Type de coloration des ailes",
			condition:{'1':[2]},
			detail:"Les motifs sont bien distincts de la couleur de fond. Dans le cas des ailes fumées, celles-ci restent transparentes mais teintées.",
			photo_etat:700,
			values:{
				'0': {id:113, name:"Partiellement fumées", detail:"Les ailes sont ornées de motifs."},
				'1': {id:114, name:"Entièrement fumées", detail:"Elles sont transparentes mais teintées"	},
				'2': {id:115, name:"Sans coloration", detail:"Les ailes ne possèdent pas de motifs et ne sont pas teintées."	},
				'3': {id:116, name:"Ailes absentes", detail:""	},
			}
		},
	'28':{	name:"Elargissement et pilosité de la patte postérieure",
			condition:{'1':[2]},
			detail:"La dernière paire de patte peut être élargie ou non. De même, elle peut être velue ou non.",
			photo_etat:710,
			values:{
				'0': {id:117, name:"Elargie, aplatie sur toute la longueur et peu velue"},
				'1': {id:118, name:"Non élargie et velue"},
				'2': {id:119, name:"Non élargie et peu ou pas velue"},
				'3': {id:120, name:"Fémur élargi peu ou pas velu"},
			}
		},
	'29':{	name:"Forme des yeux",
			condition:{'1':[2]},
			detail:"La forme des yeux importe pour différencier les Diptères (Mouches) des Hyménoptères (Abeilles, Guêpes, Bourdons)",
			photo_etat:720,
			values:{
				'0': {id:121, name:"Yeux de mouche", detail:"Yeux souvent très gros, pouvant recouvrir toute la tête."},
				'1': {id:122, name:"Yeux d'abeille, de guêpe ou de bourdon", detail:"Yeux luisants sur les côtés de la tête, en forme d'\"haricot\" ou de \"goutte d'eau\"."	},
			}
		},
	'30':{	name:"Couleurs et motifs des yeux",
			condition:{'1':[2]},
			detail:null,
			photo_etat:730,
			values:{
				'0': {id:123, name:"Yeux sombres avec des motifs"},
				'1': {id:124, name:"Yeux sombres sans motifs"},
				'2': {id:125, name:"Yeux clairs avec des motifs"},
				'3': {id:126, name:"Yeux clairs sans des motifs"},
			}
		},
	'31':{	name:"Forme de la cellule marginale",
			condition:{'1':[2]},
			detail:"Les ailes membraneuses sont solidifiées par un réseau de nervures. Les zones membraneuses délimitées par ces nervures sont appelées des cellules. La cellule marginale, est la cellule la plus en marge au niveau antérieure de l'aile.",
			photo_etat:740,
			values:{
				'0': {id:127, name:"En forme de banane"},
				'1': {id:128, name:"Autre ou absente"},
			}
		},


	'32':{	name:"Taille de votre spécimen",
			condition:{'1':[2]},
			detail:"La taille se mesure de l'extrémité de la tête à l'extrémité de l'abdomen.",
			photo_etat:750,
			values:{
				'0': {id:129, name:"Plus de 3cm"},
				'1': {id:130, name:"Moins de 3cm"},
			}	
		},
	'33':{	name:"Longueur de la jonction thorax-abdomen",
			detail:null,
			condition:{'1':[2]},
			photo_etat:760,
			values:{
				'0': {id:131, name:"Jonction longue", detail:"La jonction qui sépare le thorax de l'abdomen est longue et fine."},
				'1': {id:132, name:"Jonction courte", detail:"La jonction qui sépare le thorax de l'abdomen n'est pas marquée."},
			}	
		},
	'34':{	name:"Forme du bout de l'abdomen",
			condition:{'1':[2]},
			detail:null,
			photo_etat:770,
			values:{
				'0': {id:133, name:"Prolongé par un aiguillon"},
				'1': {id:134, name:"Terminé par une longue épine ou pointe marquée"},
				'2': {id:135, name:"Prolongé par un tube en cône"},
				'3': {id:136, name:"Rond ou légèrement pointu"},
				'4': {id:137, name:"Prolongé par une \"queue de scorpion\""},
			}	
		},
	'35':{	name:"Bout des antennes blanc",
			condition:{'1':[2]},
			detail:"L'extrémité des antennes est blanche chez certains taxons.",
			photo_etat:780,
			values:{
				'0': {id:138, name:"Oui"},
				'1': {id:139, name:"Non"},
			}	
		},

	// Tous.
	'36':{	name:"Longueur des antennes",
			detail:"La longueur des antennes se mesure d'une extrémité à l'autre.",
			photo_etat:790,
			values:{
				'0': {id:140, name:"Antennes courtes ou à peine visibles", detail:"Les antennes sont plus courtes que la longueur de la tête."},
				'1': {id:141, name:"Antennes de taille moyenne", detail:"Les antennes ne dépassent pas la longueur tête + thorax."},
				'2': {id:142, name:"Antennes longues à très longues", detail:"Les antennes dépassent nettement la longueur tête + thorax."},
			}	
		},
	'37':{	name:"Forme du corps",
			condition:{'1':[2,3]},
			detail:null,
			photo_etat:800,
			values:{
				'0': {id:143, name:"Corps allongé à très allongé", detail:"Abdomen beaucoup plus long que large. La longueur du corps (thorax + abdomen) = minimum 3 fois la largeur du corps."},
				'1': {id:144, name:"Corps assez court à trapu", detail:"Abdomen pas beaucoup plus long que large. La longueur du corps (thorax + abdomen) = moins de 3 fois la largeur du corps."},
			}	
		},

		// coleo
	'38':{	name:"Forme du corps",// (Coléoptère, Hémiptère)
			condition:{'1':[0]},
			detail:null,
			photo_etat:810,
			values:{
				'0': {id:145, name:"Corps très allongé", detail:"Corps beaucoup plus long que large.\nLa longueur fait au moins trois fois la largeur."},
				'1': {id:146, name:"Corps assez court à trapu", detail:"Corps court et large.\nLa longueur fait moins de trois fois la largeur."},
			}			
		},
	'39':{	name:"Pilosité",
			detail:"Ici nous nous intéressons à la pilosité globale.",
			photo_etat:820,
			values:{
				'0': {id:147, name:"Velu à très velu, pilosité dense"},
				'1': {id:148, name:"Peu ou pas velu, pilosité éparse"},
			}	
		},
	'40':{	name:"Présence ou absence de reflets métalliques",
			detail:"Les reflets métalliques peuvent donner l'impression que l'insecte est doté de plusieurs couleurs.",
			photo_etat:830,
			values:{
				'0': {id:149, name:"Présence de reflets métalliques"},
				'1': {id:150, name:"Absence de reflets métalliques"},
			}	
		},
	'41':{	name:"Type de coloration du corps",
			condition:{'1':[5]},
			detail:"La coloration du corps peut être unie (et donc sans aucun motif) ou avec des couleurs bien distinctes.",
			photo_etat:840,
			values:{
				'0': {id:151, name:"Corps d'une seule couleur", detail:"Tête, thorax et élytres (ou demi-élytres) sont-ils de la même couleur ? On ne considère ni les yeux, ni les antennes, ni les pattes. Des nuances de couleurs sont toutefois possibles."},
				'1': {id:152, name:"Corps de plusieurs couleurs", detail:"Sur les trois parties du corps (tête, thorax, abdomen), au moins deux couleurs différentes."},
			}
		},
	'42':{	name:"Couleur principale du corps",
			condition:{'1':[5]},
			detail:"On ne considère ni les yeux, ni les antennes, ni les pattes mais uniquement la tête, le thorax et les élytres ou demi-élytres. \nAttention ! Si vous hésitez entre différentes couleurs, vous pouvez en cocher plusieurs.",
			photo_etat:850,
			values:{
				'0': {id:153, name:"Noir"},
				'1': {id:154, name:"Marron foncé"},
				'2': {id:155, name:"Violet"},
				'3': {id:156, name:"Fauve/orange/marron clair"},
				'4': {id:157, name:"Rouge"},
				'5': {id:158, name:"Bleu"},
				'6': {id:159, name:"Vert"},
				'7': {id:160, name:"Jaune"},
			}
	},
		//coleo
	'43':{	name:"Couleur principale des élytres ou demi-élytres",
			condition:{'1':[0],'10':[0,1]},
			detail:"Les élytres sont les ailes coriaces des coléoptères de type \"scarabé\" et certaines punaises, les demi-élytres sont des ailes mi-coriace mi-membraneuses de certaines punaises. Il est parfois difficile de voir la couleur des demi-élytres.\nAttention ! Si vous hésitez entre différentes couleurs, vous pouvez en cocher plusieurs.",
			photo_etat:860,
			values:{
				'0': {id:161, name:"Noir"},
				'1': {id:162, name:"Marron foncé"},
				'2': {id:163, name:"Fauve/orange/marron clair"},
				'3': {id:164, name:"Rouge"},
				'4': {id:165, name:"Bleu"},
				'5': {id:166, name:"Vert"},
				'6': {id:167, name:"Jaune"},
				'7': {id:168, name:"Autre"},
			}
	},
	'44':{	name:"Présence ou absence d'une trompe, d'un rostre ou d'un \"bec\"",
			condition:{'1':[0,],'10':[0,1]},
			// TODO: condition.
			detail:"La trompe est l'organe avec lequel certains pollinisateurs s'alimentent. Malgré une même utilisation, il existe une diversité de formes et conduit à des comportements alimentaires différents.",
			photo_etat:870,
			values:{
				'0': {id:169, name:"Trompe fine, bien visible, toujours déployée", detail:"La longue trompe des papillons leur permet de butiner des fleurs bien plus longues que ne peuvent le faire d'autres insectes."},
				'1': {id:170, name:"Présence d'un rostre ou d'un \"bec\"", detail:""},
				'2': {id:171, name:"Absence d'une trompe ou d'un rostre bien visible ou forme différente", detail:"Trompe absente ou déployée uniquement pour butiner. Dans ce dernier cas, la trompe est de petite taille."},
			}
	},

	// Papillon
	'45':{	name:"Silhouette de votre papillon \"de jour\"",
			condition:{'1':[1], '2':[0]},
			detail:"Les Rhopalocères (papillons \"de jour\") comportent une grande diversité en terme de couleurs, de tailles, mais également de forme. Parmi les formes représentées, on distingue facilement les Héspérides des autres.",
			photo_etat:310,
			values:{
				'0': {id:172, name:"Allure d'Hespérides",
						detail:"Petit papillon trapu, marron ou fauve / orangé. Se caractérise par :\n- des antennes nettement séparées à la base ;\n- une silhouette trapue, ailes courtes, tête et corps particulièrement larges."},
				'1': {id:173, name:"Autres", 
						detail:"Tous les autres papillons n'étant pas un Hespéride."},
			}
	},
	'46':{	name:"Forme des ailes", // jour
			condition:{'1':[1], '2':[0]},
			detail:"Certains papillons ont les ailes bien plus découpées que d'autres.\nAttention cependant à ne pas confondre avec un papillon abîmé [Rajouter comment distinguer les papillons abîmés des autres].",
			photo_etat:320,
			values:{
				'0': {id:174, name:"Ailes très découpées",
						detail:"La bordure des ailes est très découpée.\nAttention à ne pas confondre avec un papillon abîmé."},
				'1': {id:175, name:"Ailes postérieures prolongées par une queue"},
				'2': {id:176, name:"Ailes en forme de feuille"},
				'3': {id:177, name:"Autres"},
			}
	},

	'47':{	name:"Couleur principale du dessus des ailes",
			condition:{'1':[1], '2':[0], '3':[0,2]},
			detail:"La couleur principale est la couleur de fond sur laquelle peuvent se superposer des motifs. \nAttention ! Si vous hésitez entre différentes couleurs, vous pouvez en cocher plusieurs.",
			photo_etat:120,
			values:{
				'0': {id:178, name:"Blanc"},
				'1': {id:179, name:"Jaune"},
				'2': {id:180, name:"Orange"},
				'3': {id:181, name:"Rouge à pourpre"},
				'4': {id:182, name:"Marron à fauve"},
				'5': {id:183, name:"Noir"},
				'6': {id:184, name:"Bleu, vert à violet"},
			}
	},
	'48':{	name:"Motifs du dessus des ailes antérieures",
			condition:{'1':[1], '2':[0],  '3':[0,2], '47':[3,5,6]},
			detail:null,
			photo_etat:970,
			values:{
				'0': {id:185, name:"Taches rouges simples"},
				'1': {id:186, name:"Taches rouges bordées de noir"},
				'2': {id:187, name:"Taches rouges très allongées"},
				'3': {id:188, name:"Taches rouges cerclées de beige"},
				'4': {id:189, name:"Autre"},	
			}
	},
	'49':{	name:"Motifs sur le dessus des ailes orange",
			photo_etat:130,
			condition:{'1':[1], '2':[0], '3':[0,2], '47':[2]},
			detail:"Les motifs sont des ornements qui peuvent être de différentes formes et couleurs.\nAttention, ne renseignez ce caractère uniquement si votre photographie le permet.",
			photo_etat:130,
			values:{
				'0': {id:190, name:"Damier noir"},
				'1': {id:191, name:"Bout des ailes antérieures noir tacheté de blanc"},
				'2': {id:192, name:"Bandes noires en bordure des ailes antérieures et taches bleues"},
				'3': {id:193, name:"Fines taches noires"},
				'4': {id:194, name:"Bordure noire"},
				'5': {id:195, name:"Bordure marron"},
				'6': {id:196, name:"Autres"},
			}
	},
	'50':{	name:"Motifs particuliers du dessus des ailes",
			condition:{'1':[1], '2':[0], '3':[0,2], '47':[2], '49':[0]},
			detail:"Les motifs sont des ornements qui peuvent être de différentes formes et couleurs.\nAttention, ne renseignez ce caractère uniquement si votre photographie le permet.",
			photo_etat:140,
			values:{
				'0': {id:197, name:"Points noirs sur le dessus des ailes antérieures et postérieures"},
				'1': {id:198, name:"Points noirs uniquement sur le dessus des ailes postérieures"},
				'2': {id:199, name:"Pas de points noirs sur le dessus des ailes"},
			}
	},
	'51':{	name:"Motifs sur le dessus des ailes marron à fauve",
			condition:{'1':[1],  '2':[0], '3':[0,2], '47':[4]},
			detail:"Les motifs sont des ornements qui peuvent être de différentes formes et couleurs.\nAttention, ne renseignez ce caractère uniquement si votre photographie le permet.",
			photo_etat:150,
			values:{
				'0': {id:200, name:"Principalement marron avec des taches oranges"},
				'1': {id:201, name:"Principalement marron sans taches oranges"},
				'2': {id:202, name:"Bout des ailes antérieures noir tacheté de blanc"},
				'3': {id:203, name:"Présence de zones bleues"},
				'4': {id:204, name:"Fines taches blanches"},
				'5': {id:205, name:"Autres"},
			}
	},
	'52':{	name:"Couleur principale du dessous des ailes",
			condition:{'1':[1], '2':[0], '3':[1,2]},
			detail:"La couleur principale est la couleur de fond sur laquelle peuvent se superposer des motifs. \nAttention ! Si vous hésitez entre différentes couleurs, vous pouvez en cocher plusieurs.",
			photo_etat:160,
			values:{
				'0': {id:206, name:"Blanc"},
				'1': {id:207, name:"Vert"},
				'2': {id:208, name:"Jaune"},
				'3': {id:209, name:"Beige, orange, marron ou gris"},
				'4': {id:210, name:"Noir"},
				'5': {id:211, name:"Rouge"},
			}
	},
		'53':{	name:"Motifs du dessous des ailes",
				condition:{'1':[1], '2':[0], '3':[1,2], '52':[0]},
				detail:"Ne renseignez ce caractère uniquement si vos photographies le permettent. Certains papillons ont tendance à garder leurs ailes ouvertes en permanence lorsqu'ils sont posés, il est alors difficile de voir le dessous des ailes.",
				photo_etat:230,
				values:{
					'0': {id:212, name:"Marbré de vert"},
					'1': {id:213, name:"Nervures grises"},
					'2': {id:214, name:"Motifs noirs"},
					'3': {id:215, name:"Motifs noirs et rouges"},
					'4': {id:216, name:"Autres"},
					'5': {id:217, name:"Sans motif"},
				}
		},
		'54':{	name:"Couleurs et motifs sur le dessous des ailes",
				condition:{'1':[1], '2':[0], '3':[1,2] '52':[3]},
				detail:"La couleur principale est la couleur de fond sur laquelle peuvent se superposer des motifs. Les motifs sont des ornements qui peuvent être de différentes formes et couleurs.\nAttention ! Si vous hésitez entre différentes couleurs, vous pouvez en cocher plusieurs.",
				photo_etat:170,
				values:{
					'0': {id:218, name:"Blanc, orange et/ou pourpre avec des motifs variés"},
					'1': {id:219, name:"Marron et/ou gris avec de fines bandes blanches"},
					'2': {id:220, name:"Marron, orange et/ou gris finement tacheté de noir"},
					'3': {id:221, name:"Marron, orange et/ou gris avec des ocelles"},
					'4': {id:222, name:"Autres couleurs et/ou motifs"},
				}
	},
	'55':{	name:"Couleur du dessous des ailes antérieures",
			condition:{'1':[1], '2':[0], '3':[1,2]},
			detail:"Chez certains papillons, l'aile antérieure est recouverte par l'aile postérieure, il est alors difficile de discerner la couleur principale (couleur de fond) du dessous des ailes antérieures.\nAttention ! Si vous hésitez entre différentes couleurs, vous pouvez en cocher plusieurs.",
			photo_etat:180,
			values:{
				'0': {id:223, name:"Orange"},
				'1': {id:224, name:"Gris, bleu ou marron"},
			}
	},
	'56':{	name:"Taches oranges sur le dessous des ailes antérieures",
			condition:{'1':[1], '2':[0], '3':[1,2]},
			detail:"Ne renseignez ce caractère uniquement si vos photographies le permettent. Certains papillons ont tendance à garder leurs ailes ouvertes en permanence lorsqu'ils sont posés, il est alors difficile de voir le dessous des ailes.",
			photo_etat:190,
			values:{
				'0': {id:225, name:"Présence"},
				'1': {id:226, name:"Absence"},
			}
	},
	// ioio 57-58 more condition
	'57':{	name:"Trait blanc sur le dessous des ailes postérieures",
			condition:{'1':[1], '2':[0], '3':[1,2]},
			detail:"Ne renseignez ce caractère uniquement si vos photographies le permettent. Certains papillons ont tendance à garder leurs ailes ouvertes en permanence lorsqu'ils sont posés, il est alors difficile de voir le dessous des ailes.",
			photo_etat:200,
			values:{
				'0': {id:227, name:"Présence"},
				'1': {id:228, name:"Absence"},
			}
	},
	'58':{	name:"Bande blanche sur le dessous des ailes postérieures",
			condition:{'1':[1], '2':[0], '3':[1,2]},
			detail:"Renseignez ce caractère uniquement si vos photographies le permettent. Certains papillons ont tendance à garder leurs ailes ouvertes en permanence lorsqu'ils sont posés, il est alors difficile de voir le dessous des ailes.",
			photo_etat:210,
			values:{
				'0': {id:229, name:"Présence", detail:"Une large bande blanche visible sur le dessous de l'aile postérieure."},
				'1': {id:230, name:"Absence", detail:"Pas de bande blanche sur le dessous de l'aile postérieure."},
			}
	},
	'59':{	name:"Motifs sur le dessous des ailes postérieures",
			condition:{'1':[1], '2':[0], '3':[1,2]},
			detail:"Ne renseignez ce caractère uniquement si vos photographies le permettent. Certains papillons ont tendance à garder leurs ailes ouvertes en permanence lorsqu'ils sont posés, il est alors difficile de voir le dessous des ailes.",
			photo_etat:220,
			values:{
				'0': {id:231, name:"Vert ou marbré de vert"},
				'1': {id:232, name:"Orange avec des taches blanches"},
				'2': {id:233, name:"Blanc avec des motifs noirs et oranges"},
				'3': {id:234, name:"Pourpre avec des taches blanches"},
				'4': {id:235, name:"Autres motifs"},
			}
	},
	'60':{	name:"Taille de votre papillon \"de nuit\"",
			condition:{'1':[1], '2':[1]},
			detail:"Les papillons peuvent également se distinguer par leur taille, du bout de la tête au bout de l'abdomen. Les papillons de petite taille (moins d'1 centimètre) appelés Microlépidoptères sont souvent difficiles à déterminer.",
			photo_etat:330,
			values:{
				'0': {id:236, name:"Papillon très petit, ne dépassant pas 1 cm"},
				'1': {id:237, name:"Papillon de plus d'1 cm"},
			}
	},
	'61':{	name:"Silhouette de votre papillon \"de nuit\"",
			condition:{'1':[1], '2':[1]},
			detail:"Les Hétérocères (papillons \"de nuit\") comportent une grande diversité en terme de couleurs, de tailles, mais également de forme.\nParmi les formes les plus représentées et les plus facilement distingables, choisissez celle à laquelle appartient votre spécimen.",
			photo_etat:240,
			values:{
				'0': {id:238, name:"Allure de petit sphinx", detail:"Papillons trapus avec un corps très large et une longue trompe."},
				'1': {id:239, name:"Allure de grand sphinx", detail:"Papillons souvent de couleur terne, avec une forme d'aile caractéristique."},
				'2': {id:240, name:"Allure de sésie", detail:"Papillons particuliers, souvent très colorés avec de fines ailes en partie transparentes et un corps large."},
				'3': {id:241, name:"Papillons aux ailes laciniées", detail:"Papillons aux ailes très découpées leur donnant un aspect d'éventail."},
				'4': {id:242, name:"En T", detail:"Lorsque leurs fines ailes sont ouvertes, ces papillons sont en forme de T."},
				'5': {id:243, name:"Papillon allongé", detail:"Papillons globalement très allongés sans posséder les caractéristiques citées précédemment."},
				'6': {id:244, name:"Papillon à museau", detail:"Papillons avec un \"museau\""},
				'7': {id:245, name:"Autre", detail:"Aspects différents de ceux cités précédemment."},
			}
	},
	'62':{	name:"Aspect de la bordure des ailes",
			condition:{'1':[1], '2':[1], '61':[1,7]}, // pap nuit, Silhouette grand sphinx et autres.
			detail:"Certains papillons ont les ailes bien plus découpées que d'autres.\nAttention cependant à ne pas confondre avec un papillon abîmé.",
			photo_etat:270,
			values:{
				'0': {id:246, name:"Bordure des ailes découpée", detail:"La bordure des ailes antérieures ou postérieures est découpée.\nAttention à ne pas confondre avec un papillon abîmé."},
				'1': {id:247, name:"Bordure des ailes non découpée", detail:"La bordure des ailes antérieures et postérieures est arrondie ou droite."},
			}
	},

	// ioio jour et nuit ?
	'63':{	name:"Couleur principale du dessus des ailes antérieures",
			condition:{'1':[1], '2':[1], '61':[1,7]}, //ioio  '2':[0], 3':[0,2]},
			detail:"La couleur principale est la couleur de fond sur laquelle peuvent se superposer les motifs.\nAttention ! Si vous hésitez entre différentes couleurs, vous pouvez en cocher plusieurs.",
			photo_etat:280,
			values:{
				'0': {id:248, name:"Noir"},
				'1': {id:249, name:"Blanc"},
				'2': {id:250, name:"Bleu"},
				'3': {id:251, name:"Jaune à orange"},
				'4': {id:252, name:"Gris clair"},
				'5': {id:253, name:"Rose à violet"},
				'6': {id:254, name:"Vert"},
				'7': {id:255, name:"Autres couleurs"},
			}
	},
	'64':{	name:"Motifs sur le dessus des ailes antérieures",
			condition:{'1':[1], '2':[1], '61':[1,7]}, //ioio  '2':[0], 3':[0,2]}, 
			detail:"Ne renseignez ce caractère uniquement si vos photographies le permettent. Certains papillons ont tendance à garder leurs ailes fermées en permanence lorsqu'ils sont posés, il n'est alors pas possible de voir les motifs du dessus des ailes.",
			photo_etat:250,
			values:{
				'0': {id:256, name:"Points et/ou taches"},
				'1': {id:257, name:"Bandes, rayures et/ou nervures"},
				'2': {id:258, name:"Sans motif"},
			}
	},
	'65':{	name:"Couleur des principaux motifs sur le dessus des ailes antérieures",
			condition:{'1':[1], '2':[1], '61':[1,7], '64':[0,1]}, //'1':[1], '2':[0], '3':[0,2]}, 
			detail:"Attention ! Si vous hésitez entre différentes couleurs, vous pouvez en cocher plusieurs.",
			photo_etat:260,
			values:{
				'0': {id:259, name:"Noir"},
				'1': {id:260, name:"Blanc, beige"},
				'2': {id:261, name:"Rouge"},
				'3': {id:262, name:"Rose"},
				'4': {id:263, name:"Jaune"},
				'5': {id:264, name:"Autres"},
			}
	},
	'66':{	name:"Le dessus des ailes antérieures et postérieures sont-ils de couleurs semblables ?",
			condition:{'1':[1], '2':[1]}, // pap nuit
			detail:"Attention, les ailes postérieures ne sont pas toujours visibles. En effet, elles sont parfois recouvertes par les ailes antérieures.",
			photo_etat:290,
			values:{
				'0': {id:265, name:"Oui"},
				'1': {id:266, name:"Non"},
			}
	},

	'67':{	name:"Couleur principale du dessus des ailes postérieures",	
			condition:{'1':[1], '2':[1], '66':[0]},
			detail:"La couleur principale est la couleur de fond sur laquelle se superposent les motifs. Les ailes postérieures ne sont pas toujours visibles. En effet, elles sont parfois recouvertes par les ailes antérieures.\nAttention ! Si vous hésitez entre différentes couleurs, vous pouvez en cocher plusieurs.",
			photo_etat:300,
			values:{
				'0': {id:267, name:"Rouge"},
				'1': {id:268, name:"Rose"},
				'2': {id:269, name:"Jaune à orange"},
				'3': {id:270, name:"Blanc"},
				'4': {id:271, name:"Autres"},		
			}
	},

	// Tous.
	'68':{	name:"Positionnement géographique",
			detail:"Zone géographique dans laquelle vous avez observé votre spécimen.",
			photo_etat:null,
			values:{
				'0': {id:272, name:"Zone montagnarde"},
				'1': {id:273, name:"Zone méditerranéenne"},
				'2': {id:274, name:"Autre"},
			}
	},
	'69':{	name:"Massif montagneux",
			condition:{'68':[0]},
			detail:"Massif montagneux dans lequel vous avez pris en photo votre spécimen.",
			photo_etat:null,
			values:{
				'0': {id:275, name:"Les Pyrénées"},
				'1': {id:276, name:"Les Alpes"},
				'2': {id:277, name:"Le Massif Central, le Jura ou les Vosges"},
			}
	},
	'70':{	name:"Localisation Méditerranée",
			condition:{'68':[1]},
			detail:"Zone méditerranéenne dans laquelle vous avez pris votre spécimen en photo.",
			photo_etat:null,
			values:{
				'0': {id:278, name:"France continentale"},
				'1': {id:279, name:"Corse"},		
			}
	},

	// Araignées.
	'71':{	name:"Nombre de parties visibles du corps",
			condition:{'1':[4]},
			detail:"Contrairement aux insectes qui possèdent trois parties (tête, thorax, abdomen), les arachnides en possèdent deux : le céphalothorax et l'abdomen. Pour certains taxons, la distinction entre ces deux parties est bien nette contrairement à d'autres qui semblent former une seule unité.",
			photo_etat:610,
			values:{
				'0': {id:280, name:"Corps en une partie", 
						detail:"Chez les opilions, le corps semble être composé d'une seule entité."
					},//	=> fini: Opilions 
				'1': {id:281, name:"Corps en deux parties bien distinctes", detail:"Chez les araignées, le corps se compose du céphalothorax et de l'abdomen."},	
			}
	},
	'72':{	name:"Type de coloration du céphalothorax",
			condition:{'1':[4],'71':[1]},
			detail:null,
			photo_etat:930,
			values:{
				'0': {id:282, name:"Uni"},
				'1': {id:283, name:"De plusieurs couleurs"},		
			}
	},
	'73':{	name:"Motifs sur le céphalothorax",
			condition:{'1':[4],'71':[1],'72':[1]},
			detail:null,
			photo_etat:940,
			values:{
				'0': {id:284, name:"Bandes bien marquées"},
				'1': {id:285, name:"Taches blanches autour des yeux"},	
				'3': {id:286, name:"Autre"},
			}
	},
	'74':{	name:"Couleurs de l'abdomen",
			condition:{'1':[4],'71':[1]},
			detail:"L'abdomen est la partie postérieure du corps.",
			photo_etat:640,
			values:{
				'0': {id:287, name:"Couleurs sombres uniquement (marron, noir, gris foncé)", detail:"L'abdomen est uniquement composé de couleurs sombres : dans les tons marron ou noir. Il peut y avoir une seule couleur ou plusieurs."},
				'1': {id:288, name:"Au moins une couleur claire (blanc, jaune, rouge etc)", detail:"L'abdomen comporte au moins une couleur autre que les tons marrons ou noir : rouge, jaune, blanc, orange, vert..."},				
			}
	},
	'75':{	name:"Présence de motifs bien distincts sur l'abdomen",
			detail:"L'abdomen est la partie postérieure du corps.\nLes motifs sont bien distincts de la couleur de fond.",
			photo_etat:620,
			condition:{'1':[4],'71':[1]},
			values:{
				'0': {id:289, name:"Oui"},
				'1': {id:290, name:"Non"},	
			}
	},
	'76':{	name:"Type de motifs sur l'abdomen",
			condition:{'1':[4],'71':[1]},
			detail:"L'abdomen est la partie postérieure du corps.\nForme des motifs dessinés sur l'abdomen.",
			photo_etat:630,
			values:{
				'0': {id:291, name:"Motif en \"feuille de chêne\"", detail:"Un motif en forme de \"feuille de chêne\" ou de \"sapin de noël\" se dessine sur l'abdomen."},
				'1': {id:292, name:"Motif en \"bicorne de Napoléon\"", detail:""},
				'2': {id:293, name:"Deux grandes bandes claires sur les côtés", detail:"Deux grandes bandes latérales se dessinent sur l'abdomen. Ces bandes sont de couleur clair : blanc, jaune pâle, beige."},
				'3': {id:294, name:"Tache cardiaque sombre bien marquée", detail:""},
				'4': {id:295, name:"Autres", detail:"Motif différent de ceux cités."},
			}
	},
	'77':{	name:"Forme de l'abdomen",
			condition:{'1':[4],'71':[1]},
			detail:"L'abdomen est la partie postérieure du corps. Il peut être de différentes formes.",
			photo_etat:650,
			values:{
				'0': {id:296, name:"Oblong", detail:"L'abdomen est de forme oblongue : allongé, fuselé, se terminant en pointe."},
				'1': {id:297, name:"Anguleux", detail:""},	
				'3': {id:298, name:"Autre", detail:"L'abdomen peut soit être globuleux, en forme de boule, ovoïde."},
			}
	},
	'78':{	name:"Type de coloration des pattes",
			condition:{'1':[4], '71':[1]},
			detail:"La coloration des pattes peut être d'une seule et même couleur ou de plusieurs couleurs.",
			photo_etat:660,
			values:{
				'0': {id:299, name:"Pattes d'une seule couleur"},
				'1': {id:300, name:"Pattes de plusieurs couleurs bien distinctes"},	
			}
	},
	'79':{	name:"Présence de très grandes épines sur les pattes",
			condition:{'1':[4], '71':[1]},
			detail:null,
			photo_etat:670,
			values:{
				'0': {id:301, name:"Oui"},
				'1': {id:302, name:"Non"},				
			}
	},
	'80':{	name:"Port et forme des pattes",
			condition:{'1':[4],'71':[1]},
			detail:"Tandis que certaines araignées ont leurs pattes complètement déployées, d'autres les regroupent près du corps.",
			photo_etat:680,
			values:{
				'0': {id:303, name:"Deux premières paires de pattes nettement plus grandes et larges que les deux autres", detail:"Rappelent la posture d'un crabe"},
				'1': {id:304, name:"Pattes courtes et regroupées près du corps, donnant une allure \"compacte\" ou trapue", detail:"Ici, les pattes sont ramassées contre le corps et donnent une allure trapue. 4 gros yeux sont souvent bien visibles."},		
				'2': {id:305, name:"Deux premières paires de pattes regroupées entre elles et positionnées vers l'avant du corps", detail:"Les pattes sont complètement déployées."},
				'3': {id:306, name:"Autres", detail:"Port et forme des pattes différents."},		
			}
	},

	// Autres ordres.
	'81':{	name:"Présence ou absence d'ailes",
			condition:{'1':[5]},
			detail:"Les ailes peuvent être au nombre de deux (Diptères : mouches) ou de quatre. Celles-ci sont translucides avec plus ou moins de nervures et peuvent être colorées (on utilise le terme \"fumées\" pour ce type d'ailes).",
			photo_etat:950,
			values:{
				'0': {id:307, name:"Présence d'ailes", detail:"Les nervures sont nombreuses, donnant un aspect de fin damier."},
				'1': {id:308, name:"Ailes absentes ou atrophiées", detail:""},	
			}
	},


	// Papillon
	'82':{	name:"Ailes translucides aux bordures colorées",
			condition:{'1':[1]},
			detail:null,
			photo_etat:920,
			values:{
				'0': {id:309, name:"Oui"},// => fin rest 3.
				'1': {id:310, name:"Non"},		
			}
	},	
	'83':{	name:"Longueur des antennes de votre papillon",
			condition:{'1':[1]},
			detail:"La longueur des antennes se mesure d'une extrémité à l'autre.",
			photo_etat:960,
			values:{
				'0': {id:311, name:"Antennes très longues, dépassant nettement la longueur du corps"},
				'1': {id:312, name:"Antennes plus courtes"},
			}
	},			
	'84':{	name:"Motifs sur le dessus des ailes blanches",
			condition:{'1':[1], '2':[0], '3':[0,2], '47':[0]},
			detail:"Les motifs sont des ornements qui peuvent être de différentes formes et couleurs.\nAttention, ne renseignez ce caractère uniquement si votre photographie le permet.",
			photo_etat:500,
			values:{
				'0': {id:313, name:"Taches rouge et noir"},
				'1': {id:314, name:"Bout des ailes antérieures orange"},
				'2': {id:315, name:"Motifs denses de couleur noire"},
				'3': {id:316, name:"Motifs denses de couleur noire"},
				'4': {id:317, name:"Autre ou absents"},
			}
	}
};
