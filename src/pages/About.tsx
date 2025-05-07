
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Users, Award, Clock } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">À propos de ConvoySync</h1>
        <p className="text-lg text-gray-600 mb-8">
          ConvoySync est une plateforme innovante de convoyage de véhicules qui met en relation les clients ayant besoin de déplacer un véhicule avec des chauffeurs professionnels.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-bold mb-4">Notre mission</h2>
            <p className="text-gray-600">
              Chez ConvoySync, nous avons pour mission de simplifier le convoyage de véhicules en offrant une solution fiable, sécurisée et transparente. Nous utilisons la technologie pour optimiser chaque étape du processus, de la demande à la livraison.
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">Notre histoire</h2>
            <p className="text-gray-600">
              Fondée en 2023, ConvoySync est née d'une vision simple : rendre le convoyage de véhicules plus accessible et efficace. Ce qui a commencé comme une petite startup est rapidement devenu un acteur majeur dans le secteur du convoyage en France.
            </p>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Pourquoi nous choisir ?</h2>
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Expérience</h3>
              <p className="text-sm text-gray-500">Des années d'expertise dans le convoyage de tous types de véhicules</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Chauffeurs qualifiés</h3>
              <p className="text-sm text-gray-500">Une équipe de professionnels formés et certifiés</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Qualité garantie</h3>
              <p className="text-sm text-gray-500">Un service premium avec assurance incluse</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Rapidité</h3>
              <p className="text-sm text-gray-500">Prise en charge rapide et livraison dans les délais</p>
            </CardContent>
          </Card>
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Notre équipe</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="mb-4 h-32 bg-gray-200 rounded-md"></div>
                <h3 className="font-bold">Nom Prénom</h3>
                <p className="text-sm text-primary mb-2">Fonction</p>
                <p className="text-sm text-gray-500">
                  Description du rôle et de l'expertise de la personne au sein de l'entreprise.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
